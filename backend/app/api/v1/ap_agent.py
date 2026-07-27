"""API endpoints for AI AP & Invoice Workflow Agent Operations."""
from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, File, Form, UploadFile, status

from app.domain.ap_agent.service import APAgentService, APWorkflowExecutionResult

router = APIRouter(prefix="/ap-agent", tags=["AI AP Agent"])
ap_agent_service = APAgentService()


@router.post("/process-invoice", response_model=APWorkflowExecutionResult, status_code=status.HTTP_200_OK)
async def process_invoice_document(
    tenant_id: UUID = Form(...),
    file: UploadFile = File(...),
) -> APWorkflowExecutionResult:
    """Execute end-to-end AI AP Agent processing on an uploaded invoice document."""
    file_bytes = await file.read()
    mock_po = {"po_number": "PO-2026-9901", "total_amount": 42000.00}
    return ap_agent_service.process_invoice_document(
        tenant_id=tenant_id,
        file_name=file.filename or "invoice.pdf",
        file_content=file_bytes,
        matched_po_data=mock_po,
    )
