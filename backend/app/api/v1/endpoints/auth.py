import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.social import SocialAccount
from app.services.social_publisher import social_publisher

logger = logging.getLogger("zap2.api.auth")
router = APIRouter()

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
    code: str,
    state: str = None,
    db: Session = Depends(get_db)
):
    """OAuth2 callback handler: exchanges authorization code for tokens and saves to DB."""
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
        base_url = settings.PUBLIC_URL.rstrip('/')
        return RedirectResponse(url=f"{base_url}/?tab=accounts&auth_success=true")

    except Exception as e:
        logger.error(f"OAuth callback failed for {platform}: {e}", exc_info=True)
        base_url = settings.PUBLIC_URL.rstrip('/')
        return RedirectResponse(url=f"{base_url}/?tab=accounts&auth_error={str(e)}")
