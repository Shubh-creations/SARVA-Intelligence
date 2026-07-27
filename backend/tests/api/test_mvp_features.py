"""Comprehensive Test Suite for All FinanceOS MVP Domain API Endpoints."""
from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
TENANT_ID = str(uuid4())


def test_health_check() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_connectors_csv_upload() -> None:
    csv_data = "date,amount,description,reference\n2026-07-20,1500.50,Client Invoice,INV-8812\n2026-07-21,-450.00,Vendor Payment,PAY-9901\n"
    response = client.post(
        "/api/v1/connectors/csv",
        data={"tenant_id": TENANT_ID},
        files={"file": ("test.csv", csv_data, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["processed_records"] == 2
    assert len(data["normalized_transactions"]) == 2


def test_forecasting_90_day() -> None:
    response = client.post(
        f"/api/v1/forecasting/90-day?tenant_id={TENANT_ID}&current_balance=1000000.0"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_days"] == 90
    assert len(data["daily_projections"]) == 90


def test_monitoring_check_duplicates() -> None:
    new_bills = [{"vendor_name": "Acme Corp", "bill_number": "INV-100", "total_amount": 5000.0}]
    existing_bills = [{"vendor_name": "Acme Corp", "bill_number": "INV-100", "bill_date": "2026-07-01"}]
    
    response = client.post(
        f"/api/v1/monitoring/check-duplicates?tenant_id={TENANT_ID}",
        json={"new_bills": new_bills, "existing_bills": existing_bills}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["alert_type"] == "DUPLICATE_INVOICE"


def test_ap_agent_process_invoice() -> None:
    pdf_content = b"%PDF-1.4 Mock Invoice Content"
    response = client.post(
        "/api/v1/ap-agent/process-invoice",
        data={"tenant_id": TENANT_ID},
        files={"file": ("invoice.pdf", pdf_content, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "extracted_invoice" in data
    assert "po_match" in data


def test_ar_agent_customer_risk() -> None:
    response = client.post(
        f"/api/v1/ar-agent/customer-risk?tenant_id={TENANT_ID}&customer_name=AcmeCorp&dso_days=45.0&late_payment_pct=25.0"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_name"] == "AcmeCorp"
    assert "risk_score" in data


def test_treasury_global_position() -> None:
    positions = [
        {"bank_name": "JPMorgan", "last4": "1234", "currency": "USD", "balance": 5000000.0, "yield_apy_pct": 0.1},
        {"bank_name": "Citi", "last4": "5678", "currency": "USD", "balance": 2000000.0, "yield_apy_pct": 5.2}
    ]
    response = client.post(
        f"/api/v1/treasury/global-position?tenant_id={TENANT_ID}",
        json=positions
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_liquidity_usd"] == 7000000.0


def test_reconciliation_bank_lines() -> None:
    bank_lines = [{"id": "b1", "amount": 1000.0, "reference": "REF123", "date": "2026-07-20"}]
    ledger_entries = [{"id": "l1", "amount": 1000.0, "reference": "REF123"}]
    
    response = client.post(
        f"/api/v1/reconciliation/reconcile-bank-lines?tenant_id={TENANT_ID}",
        json={"bank_lines": bank_lines, "ledger_entries": ledger_entries}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["tier"] == "TIER_1_EXACT"


def test_procurement_evaluate_requisition() -> None:
    vendors = [{"id": "v1", "name": "Vendor A", "pricing_score": 90.0}]
    response = client.post(
        f"/api/v1/procurement/evaluate-requisition?tenant_id={TENANT_ID}&item_desc=Hardware&qty=90&unit_price=1000.0",
        json=vendors
    )
    assert response.status_code == 200
    data = response.json()
    assert "recommended_vendor" in data


def test_knowledge_graph_subgraph() -> None:
    response = client.get(f"/api/v1/knowledge-graph/subgraph-context?tenant_id={TENANT_ID}&entity_name=AcmeCorp")
    assert response.status_code == 200
    data = response.json()
    assert len(data["subgraph_nodes"]) > 0


def test_cfo_copilot_query() -> None:
    response = client.post(f"/api/v1/cfo-copilot/query?tenant_id={TENANT_ID}&query=What is our current runway?")
    assert response.status_code == 200

    data = response.json()
    assert data["inferred_intent"] == "FORECAST_SIMULATION"


def test_recommendations_get() -> None:
    response = client.get(f"/api/v1/recommendations/?tenant_id={TENANT_ID}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
