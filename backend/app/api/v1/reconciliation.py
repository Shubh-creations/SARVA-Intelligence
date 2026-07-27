"""API endpoints for AI Reconciliation Agent Operations."""
from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, status

from app.domain.reconciliation.service import ReconciliationAgentService, ReconciliationMatch

router = APIRouter(prefix="/reconciliation", tags=["AI Reconciliation Agent"])
recon_service = ReconciliationAgentService()


@router.post("/reconcile-bank-lines", response_model=List[ReconciliationMatch], status_code=status.HTTP_200_OK)
async def reconcile_bank_lines(
    tenant_id: UUID, bank_lines: List[Dict[str, Any]], ledger_entries: List[Dict[str, Any]]
) -> List[ReconciliationMatch]:
    """Execute multi-way bank statement to double-entry ledger reconciliation."""
    return recon_service.reconcile_bank_lines(tenant_id=tenant_id, bank_lines=bank_lines, ledger_entries=ledger_entries)
