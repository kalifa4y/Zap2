import pytest
from app.services.social_publisher import SocialPublisher

@pytest.mark.asyncio
async def test_authorization_urls():
    pub = SocialPublisher()
    yt_url = pub.get_authorization_url("youtube")
    assert "youtube" in yt_url
    
    tt_url = pub.get_authorization_url("tiktok")
    assert "tiktok" in tt_url

    ig_url = pub.get_authorization_url("instagram")
    assert "instagram" in ig_url or "facebook" in ig_url

@pytest.mark.asyncio
async def test_mock_code_exchange():
    pub = SocialPublisher()
    res = await pub.exchange_code_for_token("youtube", "mock_code_123")
    assert "access_token" in res
    assert "account_name" in res

@pytest.mark.asyncio
async def test_mock_publish_video():
    pub = SocialPublisher()
    res = await pub.publish_video(
        platform="youtube",
        video_path="dummy.mp4",
        title="Test Short",
        description="Description",
        hashtags="#Shorts",
        access_token="mock_token",
        account_id="acc_123"
    )
    assert res["status"] == "PUBLISHED"
    assert "https://youtube.com/shorts/" in res["external_url"]
