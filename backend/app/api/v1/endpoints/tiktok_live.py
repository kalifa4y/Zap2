import os
import shutil
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.models.project import Project
from app.schemas.project import ProjectRead

logger = logging.getLogger("zap2.tiktok_live")

router = APIRouter()

class TikTokLiveConnectRequest(BaseModel):
    username: str
    auto_fetch_delay_hours: float = 3.0
    auto_cut_enabled: bool = True

class TikTokLiveFetchRequest(BaseModel):
    username: str
    session_id: Optional[str] = None
    stream_title: Optional[str] = "Live Replay Stream"
    instant_download: bool = True # If True in UI, fetches immediately

# In-memory session registry for simulation / live tracking
MOCK_LIVE_SESSIONS = [
    {
        "session_id": "live_sess_001",
        "username": "@creator_studio",
        "title": "🔴 Live Gaming & Débriefing Communauté #Zap2",
        "status": "ENDED", # LIVE, ENDED, READY
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat(),
        "ended_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        "duration_minutes": 115,
        "viewer_peak": 4250,
        "replay_ready": True,
        "download_url": "mock_live_stream_001.mp4"
    },
    {
        "session_id": "live_sess_002",
        "username": "@creator_studio",
        "title": "🔴 Session Q&A et Réactions en Direct",
        "status": "READY",
        "started_at": (datetime.now(timezone.utc) - timedelta(hours=28)).isoformat(),
        "ended_at": (datetime.now(timezone.utc) - timedelta(hours=26)).isoformat(),
        "duration_minutes": 84,
        "viewer_peak": 8920,
        "replay_ready": True,
        "download_url": "mock_live_stream_002.mp4"
    }
]

@router.get("/sessions", response_model=List[Dict[str, Any]])
def list_tiktok_live_sessions(username: Optional[str] = None):
    """List detected and available TikTok Live stream replays."""
    if username:
        user_clean = username.lstrip("@").lower()
        return [s for s in MOCK_LIVE_SESSIONS if user_clean in s["username"].lower()]
    return MOCK_LIVE_SESSIONS

@router.post("/connect")
def connect_tiktok_live_account(req: TikTokLiveConnectRequest):
    """
    Connect TikTok Live Studio account to automatically retrieve
    live recordings (e.g. 3 hours after live stream completion).
    """
    user_clean = f"@{req.username.lstrip('@')}"
    return {
        "status": "CONNECTED",
        "username": user_clean,
        "auto_fetch_delay_hours": req.auto_fetch_delay_hours,
        "auto_cut_enabled": req.auto_cut_enabled,
        "message": f"Compte TikTok Live {user_clean} connecté avec succès. Les replays seront importés automatiquement {req.auto_fetch_delay_hours}h après la fin du live."
    }

@router.post("/fetch-replay", response_model=ProjectRead)
def fetch_tiktok_live_replay(
    req: TikTokLiveFetchRequest,
    db: Session = Depends(get_db)
):
    """
    Ingest a TikTok Live recording directly into Zap2 as a Project.
    Copies sample/mock live media or prepares recorded stream for AI processing.
    """
    project_id = str(uuid.uuid4())
    filename = f"TikTok_Live_{req.username.lstrip('@')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    upload_dir = os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    save_path = os.path.join(upload_dir, f"{project_id}_{filename}")

    # Check if a sample raw video exists, else create mock video container
    raw_files = [f for f in os.listdir(upload_dir) if f.endswith(".mp4")] if os.path.exists(upload_dir) else []
    if raw_files:
        src_file = os.path.join(upload_dir, raw_files[0])
        shutil.copy(src_file, save_path)
    else:
        # Create minimal valid placeholder file
        with open(save_path, "wb") as f:
            f.write(b"ZAP2_TIKTOK_LIVE_STREAM_MEDIA_PLACEHOLDER")

    # Create project in DB
    new_project = Project(
        id=project_id,
        filename=filename,
        file_path=save_path,
        duration=180.0, # 3 minutes live highlight demo duration
        width=1920,
        height=1080,
        source_type="TIKTOK_LIVE",
        source_metadata=f'{{"stream_title": "{req.stream_title}", "streamer": "{req.username}", "fetched_at": "{datetime.now(timezone.utc).isoformat()}"}}',
        status="UPLOADED",
        progress=100,
        current_stage="Replay TikTok Live importé (prêt pour découpe)"
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    logger.info(f"TikTok Live replay ingested: Project {new_project.id} ({filename})")
    return new_project
