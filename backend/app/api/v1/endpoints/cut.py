import os
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Request
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.models.project import Project
from app.models.clip import Clip
from app.schemas.project import ProjectRead, ProcessVideoRequest
from app.schemas.clip import ClipRead, ClipUpdate
from app.services.video_processor import video_processor
from app.services.speech_analyzer import speech_analyzer

logger = logging.getLogger("snapcut.api.cut")
router = APIRouter()
executor = ThreadPoolExecutor(max_workers=3)

def _run_processing_pipeline(
    project_id: str,
    silence_db: float,
    min_silence_duration: float,
    whisper_model: str,
    min_clip_duration: float,
    max_clip_duration: float
):
    """Worker function executed asynchronously in background."""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error(f"Pipeline error: Project {project_id} not found")
            return

        video_full_path = os.path.join(settings.BASE_DIR, project.file_path)
        if not os.path.exists(video_full_path):
            project.status = "FAILED"
            project.error_message = "Fichier vidéo source introuvable sur le disque"
            db.commit()
            return

        # -------------------------------------------------------------
        # Étape 1 : Extraction Audio WAV (10%)
        # -------------------------------------------------------------
        project.status = "PROCESSING"
        project.progress = 10
        project.current_stage = "1/4 Extraction et normalisation de la piste audio..."
        db.commit()

        audio_filename = f"audio_{project.id}.wav"
        audio_path = os.path.join(settings.BASE_DIR, settings.TEMP_DIR, audio_filename)
        video_processor.extract_audio_wav(video_full_path, audio_path)

        # -------------------------------------------------------------
        # Étape 2 : Détection FFmpeg des Silences (30%)
        # -------------------------------------------------------------
        project.progress = 30
        project.current_stage = "2/4 Analyse acoustique et détection des silences..."
        db.commit()

        silences = video_processor.detect_silence(video_full_path, noise_db=silence_db, min_duration=min_silence_duration)
        logger.info(f"Detected {len(silences)} silence periods in {project.filename}")

        # -------------------------------------------------------------
        # Étape 3 : Transcription Faster-Whisper & Filtrage Tics (55%)
        # -------------------------------------------------------------
        project.progress = 55
        project.current_stage = "3/4 Transcription IA locale (Whisper) & détection des hésitations..."
        db.commit()

        transcription = speech_analyzer.transcribe_and_detect_fillers(audio_path, model_name=whisper_model)
        
        # Segment clips (30s-60s)
        clip_ranges = speech_analyzer.generate_smart_clip_ranges(
            total_duration=project.duration if project.duration > 0 else 120.0,
            transcription_data=transcription,
            silence_ranges=silences,
            min_clip_duration=min_clip_duration,
            max_clip_duration=max_clip_duration
        )

        if not clip_ranges:
            # Fallback single clip if short video
            clip_ranges = [{
                "title": f"Short #1 — {project.filename}",
                "description": "Moment fort extrait par SnapCut #Shorts",
                "hashtags": "#Shorts #Reels #TikTok",
                "start_time": 0.0,
                "end_time": min(project.duration, 45.0),
                "duration": min(project.duration, 45.0)
            }]

        # -------------------------------------------------------------
        # Étape 4 : Découpe, Recadrage 9:16 & Background Flouté (75% -> 100%)
        # -------------------------------------------------------------
        project.progress = 75
        project.current_stage = f"4/4 Rendu vertical 9:16 de {len(clip_ranges)} clips (1080x1920)..."
        db.commit()

        # Clean existing clips for this project if re-processing
        db.query(Clip).filter(Clip.project_id == project_id).delete()
        db.commit()

        total_clips = len(clip_ranges)
        for idx, clip_data in enumerate(clip_ranges):
            clip_id = f"clip_{project.id[:8]}_{idx+1}"
            out_filename = f"{clip_id}_9x16.mp4"
            thumb_filename = f"{clip_id}_thumb.jpg"

            out_path = os.path.join(settings.BASE_DIR, settings.EXPORT_DIR, out_filename)
            thumb_path = os.path.join(settings.BASE_DIR, settings.EXPORT_DIR, thumb_filename)

            # Render 9:16 vertical video with silence cutting / jump-cut
            video_processor.render_vertical_9x16_clip(
                input_video_path=video_full_path,
                output_clip_path=out_path,
                start_time=clip_data["start_time"],
                end_time=clip_data["end_time"],
                silence_ranges=silences
            )

            # Generate thumbnail
            video_processor.generate_thumbnail(
                video_path=out_path if os.path.exists(out_path) else video_full_path,
                thumbnail_path=thumb_path,
                timestamp=1.0
            )

            clip_entity = Clip(
                id=clip_id,
                project_id=project.id,
                title=clip_data["title"],
                hook_title=clip_data.get("hook_title", "🔥 MOMENT INATTENDU EN LIVE !"),
                thematic_topic=clip_data.get("thematic_topic", "Moment Fort"),
                virality_score=clip_data.get("virality_score", 85.0),
                subtitle_style=clip_data.get("subtitle_style", "mrbeast"),
                description=clip_data["description"],
                hashtags=clip_data["hashtags"],
                start_time=clip_data["start_time"],
                end_time=clip_data["end_time"],
                duration=clip_data["duration"],
                file_path_9x16=os.path.relpath(out_path, settings.BASE_DIR),
                thumbnail_path=os.path.relpath(thumb_path, settings.BASE_DIR) if os.path.exists(thumb_path) else None,
                status="READY"
            )
            db.add(clip_entity)
            
            # Incremental progress
            current_progress = 75 + int(((idx + 1) / total_clips) * 23)
            project.progress = min(98, current_progress)
            db.commit()

        # Clean temp audio file
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass

        project.status = "COMPLETED"
        project.progress = 100
        project.current_stage = f"Traitement terminé avec succès ! {total_clips} Shorts prêts à être publiés."
        db.commit()
        logger.info(f"Project {project_id} successfully processed into {total_clips} clips.")

    except Exception as e:
        logger.error(f"Pipeline failed for project {project_id}: {e}", exc_info=True)
        db.rollback()
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = "FAILED"
            project.error_message = f"Erreur de traitement : {str(e)}"
            db.commit()
    finally:
        db.close()


@router.post("/process", status_code=status.HTTP_202_ACCEPTED)
async def process_video(
    payload: ProcessVideoRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Triggers the full automated silence detection, transcription and 9:16 rendering pipeline."""
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")

    project.status = "PROCESSING"
    project.progress = 0
    project.current_stage = "Initialisation du pipeline de découpe..."
    project.error_message = None
    db.commit()

    # Launch in executor thread
    background_tasks.add_task(
        _run_processing_pipeline,
        project_id=project.id,
        silence_db=payload.silence_db,
        min_silence_duration=payload.min_silence_duration,
        whisper_model=payload.whisper_model,
        min_clip_duration=payload.min_clip_duration,
        max_clip_duration=payload.max_clip_duration
    )

    return {
        "project_id": project.id,
        "status": "PROCESSING",
        "progress": 0,
        "message": "Pipeline d'analyse et de découpe lancé en arrière-plan"
    }

@router.get("/projects", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    """Lists all projects with their clips."""
    return db.query(Project).order_by(Project.created_at.desc()).all()

@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project_status(project_id: str, db: Session = Depends(get_db)):
    """Gets real-time processing status and clip results for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    return project

@router.patch("/clips/{clip_id}", response_model=ClipRead)
def update_clip(
    clip_id: str,
    payload: ClipUpdate,
    db: Session = Depends(get_db)
):
    """Updates clip title, hook title, subtitle style, description, hashtags or fine-tunes start/end trim boundaries."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip non trouvé")

    if payload.title is not None:
        clip.title = payload.title
    if payload.hook_title is not None:
        clip.hook_title = payload.hook_title
    if payload.thematic_topic is not None:
        clip.thematic_topic = payload.thematic_topic
    if payload.virality_score is not None:
        clip.virality_score = payload.virality_score
    if payload.subtitle_style is not None:
        clip.subtitle_style = payload.subtitle_style
    if payload.description is not None:
        clip.description = payload.description
    if payload.hashtags is not None:
        clip.hashtags = payload.hashtags

    # If timecodes modified, re-render the 9:16 clip
    re_render = False
    if payload.start_time is not None and payload.start_time != clip.start_time:
        clip.start_time = payload.start_time
        re_render = True
    if payload.end_time is not None and payload.end_time != clip.end_time:
        clip.end_time = payload.end_time
        re_render = True

    if re_render:
        clip.duration = max(0.1, clip.end_time - clip.start_time)
        project = db.query(Project).filter(Project.id == clip.project_id).first()
        if project:
            video_full_path = os.path.join(settings.BASE_DIR, project.file_path)
            out_path = os.path.join(settings.BASE_DIR, clip.file_path_9x16)
            video_processor.render_vertical_9x16_clip(
                input_video_path=video_full_path,
                output_clip_path=out_path,
                start_time=clip.start_time,
                end_time=clip.end_time
            )

    db.commit()
    db.refresh(clip)
    return clip

@router.get("/clips/{clip_id}/stream")
def stream_clip_video(clip_id: str, request: Request, db: Session = Depends(get_db)):
    """Streams the rendered 9:16 vertical Short video."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip or not clip.file_path_9x16:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip non trouvé ou non exporté")

    file_path = os.path.join(settings.BASE_DIR, clip.file_path_9x16)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier vidéo 9:16 introuvable")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("Range")

    if range_header:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
        chunk_size = (end - start) + 1

        def iterfile():
            with open(file_path, "rb") as f:
                f.seek(start)
                bytes_left = chunk_size
                while bytes_left > 0:
                    read_size = min(64 * 1024, bytes_left)
                    data = f.read(read_size)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(iterfile(), status_code=status.HTTP_206_PARTIAL_CONTENT, headers=headers)

    def iterfile_full():
        with open(file_path, "rb") as f:
            while chunk := f.read(64 * 1024):
                yield chunk

    return StreamingResponse(
        iterfile_full(),
        headers={"Content-Length": str(file_size), "Accept-Ranges": "bytes", "Content-Type": "video/mp4"}
    )

@router.get("/clips/{clip_id}/download")
def download_clip_video(clip_id: str, db: Session = Depends(get_db)):
    """Direct local download of the 9:16 Short MP4 file."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip or not clip.file_path_9x16:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip non trouvé")

    file_path = os.path.join(settings.BASE_DIR, clip.file_path_9x16)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier vidéo introuvable")

    filename = f"{clip.title.replace(' ', '_')[:30]}_9x16.mp4"
    return FileResponse(file_path, media_type="video/mp4", filename=filename)

@router.delete("/clips/{clip_id}", status_code=status.HTTP_200_OK)
def delete_clip(clip_id: str, db: Session = Depends(get_db)):
    """Deletes a single clip and removes its rendered video and thumbnail from disk."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip non trouvé")

    project_id = clip.project_id

    # Clean clip files on disk
    if clip.file_path_9x16:
        f_path = os.path.join(settings.BASE_DIR, clip.file_path_9x16)
        if os.path.exists(f_path):
            try:
                os.remove(f_path)
            except Exception as e:
                logger.warning(f"Could not remove clip file {f_path}: {e}")

    if clip.thumbnail_path:
        t_path = os.path.join(settings.BASE_DIR, clip.thumbnail_path)
        if os.path.exists(t_path):
            try:
                os.remove(t_path)
            except Exception as e:
                logger.warning(f"Could not remove thumbnail file {t_path}: {e}")

    db.delete(clip)
    db.commit()
    logger.info(f"Clip {clip_id} deleted successfully.")
    return {"deleted": True, "clip_id": clip_id, "project_id": project_id}

@router.delete("/projects/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Deletes an entire project, its source video, and all generated clips and files."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")

    # Clean clip files
    for clip in project.clips:
        if clip.file_path_9x16:
            f_path = os.path.join(settings.BASE_DIR, clip.file_path_9x16)
            if os.path.exists(f_path):
                try:
                    os.remove(f_path)
                except Exception:
                    pass
        if clip.thumbnail_path:
            t_path = os.path.join(settings.BASE_DIR, clip.thumbnail_path)
            if os.path.exists(t_path):
                try:
                    os.remove(t_path)
                except Exception:
                    pass
        db.delete(clip)

    # Clean source video file
    if project.file_path:
        src_path = os.path.join(settings.BASE_DIR, project.file_path)
        if os.path.exists(src_path):
            try:
                os.remove(src_path)
            except Exception:
                pass

    db.delete(project)
    db.commit()
    logger.info(f"Project {project_id} and all its clips deleted successfully.")
    return {"deleted": True, "project_id": project_id}

