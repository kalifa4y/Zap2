import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.social import SocialAccount
from app.services.social_publisher import social_publisher

logger = logging.getLogger("zap2.api.auth")
router = APIRouter()

def get_base_url(request: Request) -> str:
    """Helper to detect public host URL reliably in production / proxy / local."""
    forwarded_host = request.headers.get("x-forwarded-host")
    host = forwarded_host or request.headers.get("host")
    forwarded_proto = request.headers.get("x-forwarded-proto")
    
    if host:
        proto = forwarded_proto or ("https" if "onrender.com" in host or not host.startswith("localhost") else request.url.scheme)
        return f"{proto}://{host}".rstrip('/')
    
    return settings.PUBLIC_URL.rstrip('/')

@router.get("/{platform}/authorize")
def authorize_platform(platform: str):
    """Returns the OAuth2 consent URL for the requested platform."""
    try:
        url = social_publisher.get_authorization_url(platform)
        return {"authorization_url": url, "platform": platform}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{platform}/callback")
async def oauth_callback(
    platform: str,
    request: Request,
    code: str = None,
    state: str = None,
    db: Session = Depends(get_db)
):
    """OAuth2 callback handler: exchanges authorization code for tokens and saves to DB."""
    base_url = get_base_url(request)
    
    if not code:
        logger.warning(f"OAuth callback called without code for {platform}")
        return RedirectResponse(url=f"{base_url}/?tab=accounts&auth_error=Code+manquant")

    try:
        token_info = await social_publisher.exchange_code_for_token(platform, code)

        # Check if account already exists
        existing_acc = db.query(SocialAccount).filter(
            SocialAccount.platform == platform.lower(),
            SocialAccount.account_id == token_info["account_id"]
        ).first()

        if existing_acc:
            existing_acc.account_name = token_info["account_name"]
            existing_acc.avatar_url = token_info.get("avatar_url")
            existing_acc.access_token = token_info["access_token"]
            existing_acc.refresh_token = token_info.get("refresh_token")
            existing_acc.token_expires_at = token_info.get("token_expires_at")
            existing_acc.is_active = True
        else:
            new_acc = SocialAccount(
                platform=platform.lower(),
                account_id=token_info["account_id"],
                account_name=token_info["account_name"],
                avatar_url=token_info.get("avatar_url"),
                access_token=token_info["access_token"],
                refresh_token=token_info.get("refresh_token"),
                token_expires_at=token_info.get("token_expires_at"),
                is_active=True
            )
            db.add(new_acc)

        db.commit()
        # Redirect back to frontend social tab
        return RedirectResponse(url=f"{base_url}/?tab=accounts&auth_success=true")

    except Exception as e:
        logger.error(f"OAuth callback failed for {platform}: {e}", exc_info=True)
        return RedirectResponse(url=f"{base_url}/?tab=accounts&auth_error={str(e)}")
