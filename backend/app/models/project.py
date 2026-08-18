import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    duration = Column(Float, default=0.0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    
    # Ingestion Source: FILE_UPLOAD, TIKTOK_LIVE
    source_type = Column(String(32), default="FILE_UPLOAD", nullable=False)
    source_metadata = Column(Text, nullable=True) # JSON string with live stream details
    
    # Status: UPLOADED, PROCESSING, COMPLETED, FAILED
    status = Column(String(32), default="UPLOADED", nullable=False)
    progress = Column(Integer, default=0)
    current_stage = Column(String(255), default="Uploaded")
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    clips = relationship("Clip", back_populates="project", cascade="all, delete-orphan")
