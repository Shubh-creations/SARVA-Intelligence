from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TENANT_ID = "de7995f6-42a5-4048-bc4e-db5a2d17d594"


def test_list_scenarios() -> None:
    response = client.get("/api/v1/sample-data/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 16
    assert data[0]["id"] == "aws-cloud-invoice"


def test_get_individual_scenario() -> None:
    response = client.get("/api/v1/sample-data/scenarios/jpm-mt940-statement")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "3. JPMorgan Chase SWIFT MT940 Bank Statement"
    assert "auto_recon_rate" in data["key_metrics"]


def test_health_scorecard() -> None:
    response = client.get(f"/api/v1/sample-data/health-scorecard?tenant_id={TENANT_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_health_score"] == 94
    assert data["rating"] == "EXCELLENT"


def test_master_optimization() -> None:
    response = client.post(f"/api/v1/sample-data/master-optimize?tenant_id={TENANT_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "MASTER_OPTIMIZATION_SUCCESSFUL"
    assert len(data["executed_actions"]) == 4


def test_ingest_custom_document() -> None:
    payload = {
        "file_name": "sample_invoice.csv",
        "file_content": "Line1,100.00\nLine2,250.50\nLine3,300.00",
        "industry_domain": "AI & Tech Giants"
    }
    response = client.post("/api/v1/sample-data/ingest-document", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["file_name"] == "sample_invoice.csv"
    assert len(data["line_items"]) == 3
    assert data["total_audited_usd"] == 650.50
