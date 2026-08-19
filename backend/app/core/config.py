import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "ZAP2"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    PUBLIC_URL: str = "https://zap2.onrender.com"
    ALLOWED_ORIGINS: str = "*"

    # Base Dir
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # Storage Paths
    STORAGE_DIR: str = "storage"
    UPLOAD_DIR: str = "storage/uploads"
    EXPORT_DIR: str = "storage/exports"
    TEMP_DIR: str = "storage/temp"

    # Database
    DATABASE_URL: str = "sqlite:///./zap2.db"

    # Multiprocessing / Hardware
    DEFAULT_WHISPER_MODEL: str = "base"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    # OAuth2 YouTube
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://zap2.onrender.com/api/v1/auth/youtube/callback"

    # OAuth2 TikTok
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_REDIRECT_URI: str = "https://zap2.onrender.com/api/v1/auth/tiktok/callback"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure storage directories exist
os.makedirs(os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR), exist_ok=True)
os.makedirs(os.path.join(settings.BASE_DIR, settings.EXPORT_DIR), exist_ok=True)
os.makedirs(os.path.join(settings.BASE_DIR, settings.TEMP_DIR), exist_ok=True)
