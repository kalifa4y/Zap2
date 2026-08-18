import os
import logging
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.models.clip import Clip
from app.models.social import SocialAccount, PublishJob
from app.schemas.social import SocialAccountRead, PublishClipRequest, SchedulePostRequest, PublishJobRead
from app.services.social_publisher import social_publisher
from app.services.scheduler import schedule_manager

logger = logging.getLogger("zap2.api.social")
router = APIRouter()

async def _publish_clip_task(job_id: str):
    """Background task to upload video to social platform."""
    db = SessionLocal()
    try:
        job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
        if not job:
            return

        job.status = "UPLOADING"
        db.commit()

        clip = db.query(Clip).filter(Clip.id == job.clip_id).first()
        account = db.query(SocialAccount).filter(SocialAccount.id == job.social_account_id).first()

        if not clip or not account:
            job.status = "FAILED"
            job.error_message = "Clip ou compte social introuvable"
            db.commit()
            return

        video_path = os.path.join(settings.BASE_DIR, clip.file_path_9x16) if clip.file_path_9x16 else ""

        result = await social_publisher.publish_video(
            platform=job.platform,
            video_path=video_path,
            title=clip.title,
            description=clip.description or "",
            hashtags=clip.hashtags or "",
            access_token=account.access_token,
            account_id=account.account_id
        )

        job.status = result.get("status", "FAILED")
        job.external_video_id = result.get("external_video_id")
        job.external_url = result.get("external_url")
        job.error_message = result.get("error")
        if job.status == "PUBLISHED":
            job.published_at = datetime.now(timezone.utc)

        db.commit()
    except Exception as e:
        logger.error(f"Error publishing job {job_id}: {e}", exc_info=True)
        job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
        if job:
            job.status = "FAILED"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.get("/accounts", response_model=List[SocialAccountRead])
def list_social_accounts(db: Session = Depends(get_db)):
    """Lists all connected social accounts."""
    return db.query(SocialAccount).filter(SocialAccount.is_active == True).all()

@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_account(account_id: str, db: Session = Depends(get_db)):
    """Disconnects a social account."""
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    
    db.delete(account)
    db.commit()
    return None

@router.post("/publish", status_code=status.HTTP_202_ACCEPTED)
async def publish_clip(
    payload: PublishClipRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Triggers publication of a clip to multiple social platforms."""
    clip = db.query(Clip).filter(Clip.id == payload.clip_id).first()
    if not clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip non trouvé")

    # Update metadata if custom supplied
    if payload.custom_title:
        clip.title = payload.custom_title
    if payload.custom_description:
        clip.description = payload.custom_description
    db.commit()

    created_jobs = []
    for plat in payload.platforms:
        plat_lower = plat.lower()
        account = db.query(SocialAccount).filter(
            SocialAccount.platform == plat_lower,
            SocialAccount.is_active == True
        ).first()

        # If no real account connected, create auto mock account so testing is frictionless
        if not account:
            account = SocialAccount(
                platform=plat_lower,
                account_id=f"{plat_lower}_demo_account",
                account_name=f"Studio {plat_lower.capitalize()} (Demo)",
                avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={plat_lower}",
                access_token=f"mock_token_{plat_lower}_123",
                is_active=True
            )
            db.add(account)
            db.commit()
            db.refresh(account)

        job = PublishJob(
            clip_id=clip.id,
            social_account_id=account.id,
            platform=plat_lower,
            status="PENDING"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        created_jobs.append(job.id)
        background_tasks.add_task(_publish_clip_task, job.id)

    return {
        "message": f"Publication initiée sur {len(created_jobs)} plateforme(s)",
        "job_ids": created_jobs
    }

@router.post("/schedule", status_code=status.HTTP_201_CREATED)
def schedule_clip_publication(
    payload: SchedulePostRequest,
    db: Session = Depends(get_db)
):
    """
    Schedules clip publication across platforms with customizable frequency intervals
    (every 1h, 2h, 5h, 1/day, 3/day) or specific scheduled datetime.
    """
    clip = db.query(Clip).filter(Clip.id == payload.clip_id).first()
    if not clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip non trouvé")

    if payload.custom_title:
        clip.title = payload.custom_title
    if payload.custom_description:
        clip.description = payload.custom_description
    db.commit()

    scheduled_jobs = []
    base_time = payload.scheduled_at or datetime.now(timezone.utc)

    for idx, plat in enumerate(payload.platforms):
        plat_lower = plat.lower()
        account = db.query(SocialAccount).filter(
            SocialAccount.platform == plat_lower,
            SocialAccount.is_active == True
        ).first()

        if not account:
            account = SocialAccount(
                platform=plat_lower,
                account_id=f"{plat_lower}_demo_account",
                account_name=f"Studio {plat_lower.capitalize()} (Auto-Post)",
                avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={plat_lower}",
                access_token=f"mock_token_{plat_lower}_123",
                is_active=True
            )
            db.add(account)
            db.commit()
            db.refresh(account)

        slot_time = schedule_manager.compute_scheduled_time(
            base_time=base_time,
            frequency_interval=payload.frequency_interval or "2h",
            offset_index=idx
        )

        job = PublishJob(
            clip_id=clip.id,
            social_account_id=account.id,
            platform=plat_lower,
            status="SCHEDULED",
            scheduled_at=slot_time,
            frequency_interval=payload.frequency_interval or "2h"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        scheduled_jobs.append(job.id)

    return {
        "message": f"{len(scheduled_jobs)} post(s) programmé(s) avec succès ({payload.frequency_interval})",
        "job_ids": scheduled_jobs
    }

@router.get("/calendar", response_model=List[PublishJobRead])
def list_calendar_jobs(db: Session = Depends(get_db)):
    """Retrieves all scheduled, pending, published and failed jobs for the calendar queue."""
    return db.query(PublishJob).order_by(PublishJob.created_at.desc()).all()

@router.post("/scheduler/run-now")
async def trigger_scheduler_execution(db: Session = Depends(get_db)):
    """Manually triggers execution of all due scheduled jobs."""
    executed = await schedule_manager.execute_due_jobs(db)
    return {
        "message": f"{len(executed)} tâche(s) planifiée(s) exécutée(s)",
        "executed_count": len(executed)
    }

@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """Cancels/deletes a scheduled or pending job."""
    job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job introuvable")
    db.delete(job)
    db.commit()
    return None

@router.get("/jobs/{job_id}", response_model=PublishJobRead)
def get_publish_job(job_id: str, db: Session = Depends(get_db)):
    """Retrieves the status of a specific publish job."""
    job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job de publication non trouvé")
    return job
