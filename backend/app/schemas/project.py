from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.clip import ClipRead

class ProjectBase(BaseModel):
    filename: str
    duration: float = 0.0
    width: int = 0
    height: int = 0
    source_type: str = "FILE_UPLOAD"
    source_metadata: Optional[str] = None

class ProjectCreate(ProjectBase):
    file_path: str

class ProjectRead(ProjectBase):
    id: str
    file_path: str
    status: str
    progress: int
    current_stage: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    clips: List[ClipRead] = []

    model_config = ConfigDict(from_attributes=True)

class ProcessVideoRequest(BaseModel):
    project_id: str
    silence_db: float = -30.0
    min_silence_duration: float = 0.5
    whisper_model: str = "base"
    min_clip_duration: float = 45.0
    max_clip_duration: float = 90.0
    target_clip_duration: float = 60.0
