import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Clip(Base):
    __tablename__ = "clips"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False, default="Moment Fort - Zap2")
    hook_title = Column(String(255), nullable=True, default="🔥 MOMENT INATTENDU EN LIVE !")
    thematic_topic = Column(String(255), nullable=True, default="Moment Fort")
    virality_score = Column(Float, default=88.0) # 0 to 100%
    subtitle_style = Column(String(64), default="mrbeast") # mrbeast, cyber_glow, tiktok_modern, gold_energy
    
    description = Column(Text, nullable=True, default="Extrait vidéo optimisé avec #Zap2 #Shorts #TikTok")
    hashtags = Column(String(500), nullable=True, default="#Shorts #Reels #TikTok #Zap2")
    
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    
    file_path_9x16 = Column(Text, nullable=True)
    thumbnail_path = Column(Text, nullable=True)
    
    # Status: DRAFT, READY, EXPORTING
    status = Column(String(32), default="READY", nullable=False)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    project = relationship("Project", back_populates="clips")
    publish_jobs = relationship("PublishJob", back_populates="clip", cascade="all, delete-orphan")
