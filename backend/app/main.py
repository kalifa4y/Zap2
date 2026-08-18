import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("zap2.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ZAP2 Database & Storage directories...")
    init_db()
    os.makedirs(os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR), exist_ok=True)
    os.makedirs(os.path.join(settings.BASE_DIR, settings.EXPORT_DIR), exist_ok=True)
    os.makedirs(os.path.join(settings.BASE_DIR, settings.TEMP_DIR), exist_ok=True)
    logger.info("ZAP2 Backend Engine ready for production.")
    yield
    logger.info("ZAP2 Backend Engine shutting down.")

app = FastAPI(
    title="ZAP2 API",
    description="Studio IA de découpage intelligent 9:16 & Multi-Posting TikTok, YouTube & Instagram",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
if settings.ALLOWED_ORIGINS == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage static files
storage_full_path = os.path.join(settings.BASE_DIR, settings.STORAGE_DIR)
if os.path.exists(storage_full_path):
    app.mount("/storage", StaticFiles(directory=storage_full_path), name="storage")

# Include API v1 Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME, "version": "2.0.0"}

# Production Frontend SPA Static Serving (if built in frontend/dist or static/)
frontend_dist_path = os.path.join(settings.BASE_DIR.parent, "frontend", "dist")
if not os.path.exists(frontend_dist_path):
    frontend_dist_path = os.path.join(settings.BASE_DIR, "dist")

if os.path.exists(frontend_dist_path):
    # Mount frontend assets
    assets_path = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="frontend_assets")

    # Serve index.html or catch-all for SPA routes like /privacy and /terms
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_target = os.path.join(frontend_dist_path, full_path)
        if full_path and os.path.exists(file_target) and os.path.isfile(file_target):
            return FileResponse(file_target)
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"app": settings.APP_NAME, "status": "online", "docs": "/docs"}
else:
    @app.get("/")
    def root():
        return {
            "app": settings.APP_NAME,
            "status": "online",
            "docs": "/docs",
            "api_v1": "/api/v1"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
