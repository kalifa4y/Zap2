from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ClipBase(BaseModel):
    title: str
    hook_title: Optional[str] = "🔥 MOMENT INATTENDU EN LIVE !"
    thematic_topic: Optional[str] = "Moment Fort"
    virality_score: float = 85.0
    subtitle_style: str = "mrbeast"
    description: Optional[str] = None
    hashtags: Optional[str] = None
    start_time: float
    end_time: float
    duration: float

class ClipCreate(ClipBase):
    project_id: str
    file_path_9x16: Optional[str] = None
    thumbnail_path: Optional[str] = None
    status: str = "READY"

class ClipUpdate(BaseModel):
    title: Optional[str] = None
    hook_title: Optional[str] = None
    thematic_topic: Optional[str] = None
    virality_score: Optional[float] = None
    subtitle_style: Optional[str] = None
    description: Optional[str] = None
    hashtags: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None

class ClipRead(ClipBase):
    id: str
    project_id: str
    file_path_9x16: Optional[str] = None
    thumbnail_path: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
