from fastapi import APIRouter
from app.api.v1.endpoints import videos, cut, social, auth, tiktok_live

api_router = APIRouter()

api_router.include_router(videos.router, prefix="/videos", tags=["Videos"])
api_router.include_router(cut.router, prefix="/cut", tags=["Cut & Processing"])
api_router.include_router(social.router, prefix="/social", tags=["Social"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(tiktok_live.router, prefix="/tiktok-live", tags=["TikTok Live"])
