"""Realtime Financial Risk & Anomaly Detection Service for FinanceOS MVP.
Detects duplicate invoices, expense spikes, late collections, and cash shortage alerts.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class FinancialRiskAlert(BaseModel):
    alert_id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    severity: str  # 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    alert_type: str  # 'DUPLICATE_INVOICE', 'EXPENSE_SPIKE', 'OVERDUE_AR', 'CASH_RUNWAY_SHORTFALL'
    title: str
    description: str
    financial_impact_usd: float
    confidence_score: float
    recommended_action: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RealtimeMonitoringService:
    """Detects real-time financial anomalies and generates prioritized risk alerts."""

    def check_duplicate_invoices(
        self, tenant_id: UUID, new_bills: List[Dict[str, Any]], existing_bills: List[Dict[str, Any]]
    ) -> List[FinancialRiskAlert]:
        alerts: List[FinancialRiskAlert] = []
        existing_lookup = {(b.get("vendor_name"), b.get("bill_number")): b for b in existing_bills}

        for bill in new_bills:
            key = (bill.get("vendor_name"), bill.get("bill_number"))
            if key in existing_lookup:
                matched = existing_lookup[key]
                alert = FinancialRiskAlert(
                    tenant_id=tenant_id,
                    severity="HIGH",
                    alert_type="DUPLICATE_INVOICE",
                    title=f"Duplicate Invoice Detected: #{bill.get('bill_number')}",
                    description=f"Invoice #{bill.get('bill_number')} from '{bill.get('vendor_name')}' matches existing bill created on {matched.get('bill_date')}.",
                    financial_impact_usd=float(bill.get("total_amount", 0.0)),
                    confidence_score=0.99,
                    recommended_action="Freeze payment and reject duplicate invoice entry."
                )
                alerts.append(alert)
        return alerts

    def check_expense_spikes(
        self, tenant_id: UUID, gl_category: str, current_spend: float, historical_baseline_mean: float, std_dev: float
    ) -> Optional[FinancialRiskAlert]:
        if std_dev <= 0:
            return None
        
        z_score = (current_spend - historical_baseline_mean) / std_dev
        if z_score >= 3.0:  # 3-sigma anomaly rule
            variance_amt = current_spend - historical_baseline_mean
            return FinancialRiskAlert(
                tenant_id=tenant_id,
                severity="CRITICAL" if z_score >= 4.5 else "HIGH",
                alert_type="EXPENSE_SPIKE",
                title=f"Anomalous Expense Spike in {gl_category}",
                description=f"Current spend of ${current_spend:,.2f} is {z_score:.1f}x standard deviations above historical baseline (${historical_baseline_mean:,.2f}).",
                financial_impact_usd=round(variance_amt, 2),
                confidence_score=0.95,
                recommended_action="Audit department line-item expenses and verify approval authorization."
            )
        return None

    def check_overdue_collections(
        self, tenant_id: UUID, open_invoices: List[Dict[str, Any]]
    ) -> List[FinancialRiskAlert]:
        alerts: List[FinancialRiskAlert] = []
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        for inv in open_invoices:
            due_date = inv.get("due_date", today_str)
            status = inv.get("status", "SENT")
            if status != "PAID" and due_date < today_str:
                amount = float(inv.get("total_amount", 0.0))
                cust = inv.get("customer_name", "Customer")
                alert = FinancialRiskAlert(
                    tenant_id=tenant_id,
                    severity="MEDIUM" if amount < 25000 else "HIGH",
                    alert_type="OVERDUE_AR",
                    title=f"Overdue Collection Alert: {cust}",
                    description=f"Invoice #{inv.get('invoice_number')} for ${amount:,.2f} is overdue (Due date: {due_date}).",
                    financial_impact_usd=amount,
                    confidence_score=0.98,
                    recommended_action="Trigger AR Agent dynamic dunning outreach to customer finance team."
                )
                alerts.append(alert)
        return alerts
