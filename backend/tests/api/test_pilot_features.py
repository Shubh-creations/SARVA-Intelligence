from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
TENANT_ID = "de7995f6-42a5-4048-bc4e-db5a2d17d594"


def test_submit_feedback() -> None:
    payload = {
        "category": "UX",
        "subject": "Pilot UI Feedback",
        "description": "Love the demo mode badges and dark/light mode toggle.",
        "user_email": "pilot@acme.com"
    }
    response = client.post(f"/api/v1/feedback/submit?tenant_id={TENANT_ID}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "feedback_id" in data


def test_get_settings_profile() -> None:
    response = client.get("/api/v1/settings/profile")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "company" in data


def test_update_settings_profile() -> None:
    payload = {
        "name": "Sarah Jensen",
        "email": "sarah.jensen@acme-enterprise.com",
        "company": "Acme Enterprise Corp",
        "role": "Chief Financial Officer"
    }
    response = client.post("/api/v1/settings/profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"


def test_export_tenant_data() -> None:
    response = client.get(f"/api/v1/settings/export-data?tenant_id={TENANT_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == TENANT_ID
    assert "user_profile" in data
    assert "audit_log" in data
