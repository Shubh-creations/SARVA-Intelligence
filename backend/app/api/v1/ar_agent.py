"""API endpoints for AI AR Agent Operations."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, status

from app.domain.ar_agent.service import ARAgentService, CashAppMatchResult, CustomerRiskProfile, DisputeCase

router = APIRouter(prefix="/ar-agent", tags=["AI AR Agent"])
ar_service = ARAgentService()


@router.post("/customer-risk", response_model=CustomerRiskProfile, status_code=status.HTTP_200_OK)
async def calculate_customer_risk(
    tenant_id: UUID, customer_name: str, dso_days: float = 35.0, late_payment_pct: float = 15.0
) -> CustomerRiskProfile:
    """Calculate customer credit risk score and dynamic dunning strategy."""
    return ar_service.calculate_customer_risk(tenant_id=tenant_id, customer_name=customer_name, dso_days=dso_days, late_payment_pct=late_payment_pct)


@router.post("/match-cash-application", response_model=CashAppMatchResult, status_code=status.HTTP_200_OK)
async def match_cash_application(
    tenant_id: UUID, remittance_id: str, amount: float, reference: Optional[str], open_invoices: List[Dict[str, Any]]
) -> CashAppMatchResult:
    """Match bank remittance payment to open customer invoices using deterministic & subset-sum matching."""
    return ar_service.match_cash_application(tenant_id=tenant_id, bank_remittance_id=remittance_id, amount=amount, reference=reference, open_invoices=open_invoices)


@router.post("/dispute-short-pay", response_model=DisputeCase, status_code=status.HTTP_200_OK)
async def handle_short_pay_dispute(
    tenant_id: UUID, customer_name: str, invoice_number: str, billed_amount: float, paid_amount: float
) -> DisputeCase:
    """Infer dispute reason for short-pay and issue credit memo if applicable."""
    return ar_service.handle_short_pay_dispute(tenant_id=tenant_id, customer_name=customer_name, invoice_number=invoice_number, billed_amount=billed_amount, paid_amount=paid_amount)
