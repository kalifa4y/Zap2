import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    platform = Column(String(32), nullable=False, index=True) # youtube, tiktok, instagram
    account_id = Column(String(128), nullable=False)
    account_name = Column(String(128), nullable=False)
    avatar_url = Column(Text, nullable=True)
    
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    publish_jobs = relationship("PublishJob", back_populates="social_account", cascade="all, delete-orphan")

class PublishJob(Base):
    __tablename__ = "publish_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    clip_id = Column(String(36), ForeignKey("clips.id", ondelete="CASCADE"), nullable=False, index=True)
    social_account_id = Column(String(36), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False)
    
    platform = Column(String(32), nullable=False)
    # Status: PENDING, SCHEDULED, UPLOADING, PUBLISHED, FAILED
    status = Column(String(32), default="PENDING", nullable=False)
    
    scheduled_at = Column(DateTime, nullable=True)
    frequency_interval = Column(String(32), nullable=True) # e.g. "1h", "2h", "5h", "1_day", "3_day"
    
    external_video_id = Column(String(128), nullable=True)
    external_url = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    clip = relationship("Clip", back_populates="publish_jobs")
    social_account = relationship("SocialAccount", back_populates="publish_jobs")
