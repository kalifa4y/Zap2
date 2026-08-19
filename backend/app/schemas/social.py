from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class SocialAccountBase(BaseModel):
    platform: str
    account_id: str
    account_name: str
    avatar_url: Optional[str] = None
    is_active: bool = True

class SocialAccountCreate(SocialAccountBase):
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None

class SocialAccountRead(SocialAccountBase):
    id: str
    token_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PublishClipRequest(BaseModel):
    clip_id: str
    platforms: List[str] # ["youtube", "tiktok"]
    custom_title: Optional[str] = None
    custom_description: Optional[str] = None

class SchedulePostRequest(BaseModel):
    clip_id: str
    platforms: List[str] # ["youtube", "tiktok"]
    scheduled_at: Optional[datetime] = None
    frequency_interval: Optional[str] = "2h" # "1h", "2h", "5h", "1_day", "3_day", "custom"
    custom_title: Optional[str] = None
    custom_description: Optional[str] = None

class PublishJobRead(BaseModel):
    id: str
    clip_id: str
    social_account_id: str
    platform: str
    status: str
    scheduled_at: Optional[datetime] = None
    frequency_interval: Optional[str] = None
    external_video_id: Optional[str] = None
    external_url: Optional[str] = None
    error_message: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
