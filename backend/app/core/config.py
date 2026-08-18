import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "SnapCut"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:3000,http://127.0.0.1:3000"

    # Base Dir
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # Storage Paths
    STORAGE_DIR: str = "storage"
    UPLOAD_DIR: str = "storage/uploads"
    EXPORT_DIR: str = "storage/exports"
    TEMP_DIR: str = "storage/temp"

    # Database
    DATABASE_URL: str = "sqlite:///./snapcut.db"

    # Multiprocessing / Hardware
    DEFAULT_WHISPER_MODEL: str = "base"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    # OAuth2 YouTube
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/youtube/callback"

    # OAuth2 TikTok
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/tiktok/callback"

    # OAuth2 Instagram
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    INSTAGRAM_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/instagram/callback"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure storage directories exist
os.makedirs(os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR), exist_ok=True)
os.makedirs(os.path.join(settings.BASE_DIR, settings.EXPORT_DIR), exist_ok=True)
os.makedirs(os.path.join(settings.BASE_DIR, settings.TEMP_DIR), exist_ok=True)
