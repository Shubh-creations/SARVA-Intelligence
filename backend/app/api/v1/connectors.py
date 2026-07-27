"""API endpoints for Financial System Connectors and Data Ingestion."""
from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.domain.connectors.service import IngestionResult, IngestionService

router = APIRouter(prefix="/connectors", tags=["Connectors & Ingestion"])
ingestion_service = IngestionService()


@router.post("/csv", response_model=IngestionResult, status_code=status.HTTP_200_OK)
async def ingest_csv_file(
    tenant_id: UUID = Form(...),
    file: UploadFile = File(...)
) -> IngestionResult:
    """Upload and parse a financial CSV file into canonical transactions."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    contents = await file.read()
    csv_text = contents.decode("utf-8", errors="ignore")
    return ingestion_service.process_csv_transactions(tenant_id=tenant_id, csv_content=csv_text)


@router.post("/quickbooks-webhook", response_model=IngestionResult, status_code=status.HTTP_200_OK)
async def ingest_quickbooks_payload(
    tenant_id: UUID,
    payload: Dict[str, Any]
) -> IngestionResult:
    """Ingest real-time bill webhook payloads from QuickBooks / Xero."""
    return ingestion_service.process_quickbooks_bill_payload(tenant_id=tenant_id, payload=payload)
