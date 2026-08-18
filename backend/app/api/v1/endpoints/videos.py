import os
import shutil
import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.config import settings
from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectRead
from app.services.video_processor import video_processor

logger = logging.getLogger("snapcut.api.videos")
router = APIRouter()

@router.post("/upload", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a local raw video file and initializes project metadata."""
    allowed_extensions = {".mp4", ".mov", ".mkv", ".webm"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format de fichier non supporté ({ext}). Formats acceptés : {', '.join(allowed_extensions)}"
        )

    # Save to storage/uploads
    filename = f"{os.path.splitext(file.filename)[0]}_{os.urandom(4).hex()}{ext}"
    dest_path = os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR, filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Error saving uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement du fichier : {str(e)}"
        )

    # Extract metadata via ffprobe
    meta = video_processor.get_video_metadata(dest_path)

    project = Project(
        filename=file.filename,
        file_path=os.path.relpath(dest_path, settings.BASE_DIR),
        duration=meta.get("duration", 0.0),
        width=meta.get("width", 1920),
        height=meta.get("height", 1080),
        status="UPLOADED",
        progress=0,
        current_stage="Fichier importé avec succès"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return project

class UrlDownloadRequest(BaseModel):
    url: str

@router.post("/download-url", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def download_video_from_url(
    payload: UrlDownloadRequest,
    db: Session = Depends(get_db)
):
    """Downloads a video or live recording directly from an online URL using yt-dlp."""
    import uuid
    from app.services.video_downloader import video_downloader

    project_id = str(uuid.uuid4())
    res = video_downloader.download_from_url(payload.url, project_id=project_id)

    if not res["success"] or not res["file_path"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Échec du téléchargement du lien : {res.get('error')}"
        )

    project = Project(
        id=project_id,
        filename=res["filename"] or "Video_Online.mp4",
        file_path=os.path.relpath(res["file_path"], settings.BASE_DIR),
        duration=res["duration"],
        width=res["width"],
        height=res["height"],
        source_type="ONLINE_URL",
        source_metadata=f'{{"source_url": "{payload.url}", "uploader": "{res.get("uploader", "")}"}}',
        status="UPLOADED",
        progress=100,
        current_stage="Vidéo téléchargée depuis l'URL (prête pour la découpe)"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return project

@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Retrieves project details and its clips."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")
    return project

@router.get("/stream/{project_id}")
def stream_video(project_id: str, request: Request, db: Session = Depends(get_db)):
    """Streams video file with HTTP 206 partial content support for smooth scrubbing."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet non trouvé")

    file_path = os.path.join(settings.BASE_DIR, project.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier vidéo introuvable")

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
