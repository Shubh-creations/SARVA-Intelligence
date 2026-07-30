from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TENANT_ID = "de7995f6-42a5-4048-bc4e-db5a2d17d594"


def test_intercompany_netting_summary() -> None:
    payload = [
        {"from_subsidiary": "US_Corp", "to_subsidiary": "UK_Ltd", "amount_usd": 500000.0},
        {"from_subsidiary": "UK_Ltd", "to_subsidiary": "EU_GmbH", "amount_usd": 300000.0},
        {"from_subsidiary": "EU_GmbH", "to_subsidiary": "US_Corp", "amount_usd": 400000.0},
    ]
    response = client.post(f"/api/v1/tier1-ops/netting-summary?tenant_id={TENANT_ID}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["gross_wires_count"] == 3
    assert data["net_wires_count"] < 3
    assert data["estimated_fx_fee_savings_usd"] > 0


def test_yield_sweep_summary() -> None:
    response = client.get(f"/api/v1/tier1-ops/yield-summary?tenant_id={TENANT_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["annual_yield_pct"] == 5.2
    assert data["estimated_daily_yield_usd"] > 0


def test_covenant_health_summary() -> None:
    response = client.get(f"/api/v1/tier1-ops/covenant-summary?tenant_id={TENANT_ID}")
    assert response.status_code == 200
    data = response.json()
    assert data["health_score_pct"] == 100
    assert data["status"] == "100% SAFE"
