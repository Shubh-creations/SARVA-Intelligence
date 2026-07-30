from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TENANT_ID = "de7995f6-42a5-4048-bc4e-db5a2d17d594"


def test_aml_sanctions_screening_exact_hit() -> None:
    response = client.get("/api/v1/compliance/aml-screen?name=VLADIMIR%20PETROV")
    assert response.status_code == 200
    data = response.json()
    assert data["flagged"] is True
    assert data["match_type"] == "EXACT_SDN_HIT"
    assert data["execution_time_ms"] < 2.0


def test_aml_sanctions_screening_cleared() -> None:
    response = client.get("/api/v1/compliance/aml-screen?name=JOHN%20SMITH%20ENTITIES")
    assert response.status_code == 200
    data = response.json()
    assert data["flagged"] is False
    assert data["match_type"] == "CLEARED"


def test_sox_404_sod_violation() -> None:
    payload = {
        "transaction_id": "tx-8812",
        "tenant_id": TENANT_ID,
        "creator_user_id": "user-alex-123",
        "approver_user_id": "user-alex-123",  # Same user ID -> SoD Violation
        "amount_usd": 75000.0,
        "transfer_type": "WIRE"
    }
    response = client.post("/api/v1/compliance/sod-verify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["authorized"] is False
    assert data["sod_violation"] is True


def test_sox_404_dual_approval_required() -> None:
    payload = {
        "transaction_id": "tx-8813",
        "tenant_id": TENANT_ID,
        "creator_user_id": "user-alex-123",
        "approver_user_id": None,  # Amount > $50k requires 2nd signature
        "amount_usd": 120000.0,
        "transfer_type": "WIRE"
    }
    response = client.post("/api/v1/compliance/sod-verify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["authorized"] is False
    assert data["sod_violation"] is False


def test_gdpr_cryptographic_shredder() -> None:
    response = client.post(f"/api/v1/compliance/gdpr-shred?tenant_id={TENANT_ID}&requester_id=usr_dpo_01&reason=Article17Request")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CRYPTOGRAPHICALLY_ERASED"


def test_iso20022_pacs008_wire_generation() -> None:
    payload = {
        "message_id": "MSG-FEDWIRE-2026-9901",
        "debtor_name": "Acme Enterprise Corp",
        "debtor_iban": "US89BOFA1234567890",
        "creditor_name": "Global Tech Supplier",
        "creditor_iban": "US44JPM9876543210",
        "amount": 250000.00,
        "currency": "USD"
    }
    response = client.post("/api/v1/advanced-fintech/iso20022-clear", json=payload)
    assert response.status_code == 200
    assert "FIToFICstmrCdtTrf" in response.text
    assert "MSG-FEDWIRE-2026-9901" in response.text


def test_gnn_fraud_scoring() -> None:
    payload = {
        "transaction_id": "tx-fraud-check-1",
        "tenant_id": TENANT_ID,
        "amount": 350000.0,
        "ip_address": "192.168.1.1",
        "device_fingerprint_hash": "TOR_EXIT_NODE_99",
        "recipient_account_hash": "acct_hash_881",
        "velocity_1h_count": 12
    }
    response = client.post("/api/v1/advanced-fintech/fraud-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["fraud_risk_score"] > 0.65
    assert data["risk_level"] == "HIGH"


def test_voice_cfo_query() -> None:
    response = client.post(f"/api/v1/advanced-fintech/voice-query?tenant_id={TENANT_ID}&audio_b64=UklGRi...")
    assert response.status_code == 200
    data = response.json()
    assert data["audio_synthesized"] is True
    assert "liquid" in data["executive_answer"]
