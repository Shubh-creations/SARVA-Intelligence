"""API endpoints for AI Procurement Agent Operations."""
from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, status

from app.domain.procurement.service import ProcurementAgentService, ProcurementRequisitionEvaluation, SupplierScorecard

router = APIRouter(prefix="/procurement", tags=["AI Procurement Agent"])
procurement_service = ProcurementAgentService()


@router.post("/evaluate-suppliers", response_model=List[SupplierScorecard], status_code=status.HTTP_200_OK)
async def evaluate_suppliers_maut(
    tenant_id: UUID, vendors: List[Dict[str, Any]]
) -> List[SupplierScorecard]:
    """Evaluate and rank suppliers using Multi-Attribute Utility Theory (MAUT) scorecard."""
    return procurement_service.evaluate_suppliers_maut(tenant_id=tenant_id, vendors=vendors)


@router.post("/evaluate-requisition", response_model=ProcurementRequisitionEvaluation, status_code=status.HTTP_200_OK)
async def evaluate_requisition(
    tenant_id: UUID, item_desc: str, qty: int, unit_price: float, vendors: List[Dict[str, Any]]
) -> ProcurementRequisitionEvaluation:
    """Audit requisition for fraud, contract price caps, and volume discount tier opportunities."""
    return procurement_service.evaluate_requisition(tenant_id=tenant_id, item_desc=item_desc, qty=qty, unit_price=unit_price, vendor_list=vendors)
