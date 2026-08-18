import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("snapcut.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SnapCut Database & Storage directories...")
    init_db()
    os.makedirs(os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR), exist_ok=True)
    os.makedirs(os.path.join(settings.BASE_DIR, settings.EXPORT_DIR), exist_ok=True)
    os.makedirs(os.path.join(settings.BASE_DIR, settings.TEMP_DIR), exist_ok=True)
    logger.info("SnapCut Backend Engine ready.")
    yield
    logger.info("SnapCut Backend Engine shutting down.")

app = FastAPI(
    title="SnapCut API",
    description="Backend de découpage intelligent de lives & multi-posting vertical 9:16",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static mounts for exported thumbnails and clips
storage_full_path = os.path.join(settings.BASE_DIR, settings.STORAGE_DIR)
if os.path.exists(storage_full_path):
    app.mount("/storage", StaticFiles(directory=storage_full_path), name="storage")

# Include API v1 Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
