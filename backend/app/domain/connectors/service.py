"""Ingestion & Connector Service for FinanceOS MVP.
Parses, sanitizes, and normalizes CSV, Bank Feeds, and ERP data into Canonical Financial Data Models.
"""
from __future__ import annotations

import csv
import hashlib
import io
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class CanonicalTransaction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    bank_account_id: Optional[UUID] = None
    transaction_date: str
    amount: float
    currency: str = "USD"
    debit_account_code: str
    credit_account_code: str
    description: str
    reference_number: Optional[str] = None
    reconciliation_status: str = "UNRECONCILED"
    dedup_hash: str


class CanonicalBill(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    vendor_name: str
    bill_number: str
    bill_date: str
    due_date: str
    total_amount: float
    currency: str = "USD"
    status: str = "RECEIVED"
    line_items: List[Dict[str, Any]] = Field(default_factory=list)
    dedup_hash: str


class IngestionResult(BaseModel):
    tenant_id: UUID
    source_type: str
    processed_records: int
    duplicated_records: int
    errors: List[str] = Field(default_factory=list)
    normalized_transactions: List[CanonicalTransaction] = Field(default_factory=list)
    normalized_bills: List[CanonicalBill] = Field(default_factory=list)


class IngestionService:
    """Handles financial data ingestion, fingerprint deduplication, and canonical normalization."""

    def __init__(self) -> None:
        self._seen_hashes: set[str] = set()

    def _compute_hash(self, tenant_id: UUID, key: str) -> str:
        raw = f"{tenant_id}:{key}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def process_csv_transactions(
        self, tenant_id: UUID, csv_content: str, source_name: str = "CSV_UPLOAD"
    ) -> IngestionResult:
        """Parse raw CSV text into canonical transactions with deduplication."""
        result = IngestionResult(tenant_id=tenant_id, source_type=source_name, processed_records=0, duplicated_records=0)
        
        try:
            reader = csv.DictReader(io.StringIO(csv_content))
            for row in reader:
                result.processed_records += 1
                
                # Extract fields with safe fallbacks
                txn_date = row.get("date") or row.get("Transaction Date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
                amount_str = row.get("amount") or row.get("Amount") or "0.0"
                desc = row.get("description") or row.get("Description") or "CSV Import"
                ref_num = row.get("reference") or row.get("Reference") or row.get("Invoice Number") or ""
                
                try:
                    amount = float(amount_str.replace(",", "").replace("$", "").strip())
                except ValueError:
                    result.errors.append(f"Row {result.processed_records}: Invalid amount '{amount_str}'")
                    continue

                # Deduplication key
                dedup_key = f"{txn_date}:{amount}:{desc}:{ref_num}"
                h = self._compute_hash(tenant_id, dedup_key)

                if h in self._seen_hashes:
                    result.duplicated_records += 1
                    continue
                
                self._seen_hashes.add(h)

                # Determine debit/credit GL code defaults
                debit_code = "GL-1010-CASH" if amount > 0 else "GL-5000-EXPENSE"
                credit_code = "GL-4000-REVENUE" if amount > 0 else "GL-1010-CASH"

                canonical_txn = CanonicalTransaction(
                    tenant_id=tenant_id,
                    transaction_date=txn_date,
                    amount=abs(amount),
                    currency=row.get("currency") or "USD",
                    debit_account_code=debit_code,
                    credit_account_code=credit_code,
                    description=desc,
                    reference_number=ref_num if ref_num else None,
                    dedup_hash=h
                )
                result.normalized_transactions.append(canonical_txn)

        except Exception as err:
            logger.error("Failed to parse CSV ingestion", exc_info=True)
            result.errors.append(f"CSV Parsing Error: {str(err)}")

        return result

    def process_quickbooks_bill_payload(self, tenant_id: UUID, payload: Dict[str, Any]) -> IngestionResult:
        """Normalize QuickBooks / Xero API Webhook Bill Payloads."""
        result = IngestionResult(tenant_id=tenant_id, source_type="QUICKBOOKS_API", processed_records=1, duplicated_records=0)
        
        vendor = payload.get("VendorRef", {}).get("name") or payload.get("vendor_name") or "Unknown Vendor"
        bill_num = payload.get("DocNumber") or payload.get("bill_number") or f"BILL-{uuid4().hex[:6]}"
        total = float(payload.get("TotalAmt") or payload.get("total_amount") or 0.0)
        txn_date = payload.get("TxnDate") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        due_date = payload.get("DueDate") or txn_date

        dedup_key = f"{vendor}:{bill_num}:{total}:{txn_date}"
        h = self._compute_hash(tenant_id, dedup_key)

        if h in self._seen_hashes:
            result.duplicated_records += 1
            return result

        self._seen_hashes.add(h)

        bill = CanonicalBill(
            tenant_id=tenant_id,
            vendor_name=vendor,
            bill_number=bill_num,
            bill_date=txn_date,
            due_date=due_date,
            total_amount=total,
            currency=payload.get("CurrencyRef", {}).get("value") or "USD",
            status="RECEIVED",
            line_items=payload.get("Line", []),
            dedup_hash=h
        )
        result.normalized_bills.append(bill)
        return result
