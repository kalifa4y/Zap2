import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_projects_empty_or_valid():
    response = client.get("/api/v1/cut/projects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_auth_authorize_urls():
    for platform in ["youtube", "tiktok"]:
        response = client.get(f"/api/v1/auth/{platform}/authorize")
        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        assert data["platform"] == platform

def test_social_accounts_list():
    response = client.get("/api/v1/social/accounts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_invalid_platform_auth():
    response = client.get("/api/v1/auth/invalid_platform/authorize")
    assert response.status_code == 400

def test_delete_nonexistent_clip():
    response = client.delete("/api/v1/cut/clips/non_existent_clip_123")
    assert response.status_code == 404

def test_delete_nonexistent_project():
    response = client.delete("/api/v1/cut/projects/non_existent_project_123")
    assert response.status_code == 404

