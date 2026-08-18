import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.social import PublishJob, SocialAccount
from app.models.clip import Clip
from app.services.social_publisher import social_publisher

logger = logging.getLogger("zap2.scheduler")

class ScheduleManager:
    FREQUENCY_DELTAS = {
        "1h": timedelta(hours=1),
        "2h": timedelta(hours=2),
        "5h": timedelta(hours=5),
        "1_day": timedelta(days=1),
        "3_day": timedelta(hours=8), # 3 times per day = every 8h
    }

    def compute_scheduled_time(
        self,
        base_time: Optional[datetime] = None,
        frequency_interval: str = "2h",
        offset_index: int = 0
    ) -> datetime:
        now = base_time or datetime.now(timezone.utc)
        delta = self.FREQUENCY_DELTAS.get(frequency_interval, timedelta(hours=2))
        return now + (delta * (offset_index + 1))

    async def execute_due_jobs(self, db: Session) -> List[PublishJob]:
        """Finds all SCHEDULED or PENDING jobs whose scheduled_at <= now() and publishes them."""
        now = datetime.now(timezone.utc)
        due_jobs = db.query(PublishJob).filter(
            PublishJob.status.in_(["PENDING", "SCHEDULED"]),
            PublishJob.scheduled_at <= now
        ).all()

        executed = []
        for job in due_jobs:
            job.status = "UPLOADING"
            db.commit()

            clip = db.query(Clip).filter(Clip.id == job.clip_id).first()
            account = db.query(SocialAccount).filter(SocialAccount.id == job.social_account_id).first()

            if not clip or not account:
                job.status = "FAILED"
                job.error_message = "Clip ou compte social introuvable."
                db.commit()
                continue

            try:
                res = await social_publisher.publish_video(
                    platform=job.platform,
                    video_path=clip.file_path_9x16 or "",
                    title=clip.title,
                    description=clip.description or "",
                    hashtags=clip.hashtags or "",
                    access_token=account.access_token,
                    account_id=account.account_id
                )
                if res.get("status") == "PUBLISHED":
                    job.status = "PUBLISHED"
                    job.external_video_id = res.get("external_video_id")
                    job.external_url = res.get("external_url")
                    job.published_at = datetime.now(timezone.utc)
                else:
                    job.status = "FAILED"
                    job.error_message = res.get("error")
                db.commit()
                executed.append(job)
            except Exception as e:
                logger.error(f"Scheduler failed to publish job {job.id}: {e}")
                job.status = "FAILED"
                job.error_message = str(e)
                db.commit()

        return executed

schedule_manager = ScheduleManager()
