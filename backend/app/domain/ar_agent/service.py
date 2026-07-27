"""AI Accounts Receivable (AR) Agent Service for FinanceOS MVP.
Handles billing, credit risk scoring, risk-based dunning, cash application matching, and dispute management.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class CustomerRiskProfile(BaseModel):
    customer_id: UUID = Field(default_factory=uuid4)
    customer_name: str
    dso_days: float
    risk_score: float  # 0 to 100
    risk_tier: str  # 'TIER_1_LOW', 'TIER_2_MODERATE', 'TIER_3_HIGH'
    recommended_dunning_action: str
    credit_limit: float


class CashAppMatchResult(BaseModel):
    remittance_id: str
    matched_invoice_number: Optional[str]
    matched_amount: float
    match_strategy: str  # 'EXACT_REFERENCE', 'AMOUNT_CUSTOMER_MATCH', 'SUBSET_SUM_BUNDLE', 'UNMATCHED'
    confidence: float
    status: str  # 'MATCHED_AND_CLEARED', 'SHORT_PAY_DISPUTE', 'UNMATCHED_REVIEWS'


class DisputeCase(BaseModel):
    dispute_id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    customer_name: str
    invoice_number: str
    billed_amount: float
    paid_amount: float
    short_pay_amount: float
    inferred_reason: str
    suggested_action: str
    auto_credit_memo_issued: bool


class ARAgentService:
    """Automates Accounts Receivable billing, risk-based dunning, cash application, and disputes."""

    def calculate_customer_risk(
        self, tenant_id: UUID, customer_name: str, dso_days: float, late_payment_pct: float
    ) -> CustomerRiskProfile:
        # Risk Score Formula: 40% DSO + 35% Late Pct + 25% Baseline Sector Risk
        score = min(100.0, max(0.0, (dso_days * 0.8) + (late_payment_pct * 0.5)))
        
        if score < 25.0:
            tier = "TIER_1_LOW"
            action = "Standard billing terms; send friendly email reminder at Day +5"
        elif score < 60.0:
            tier = "TIER_2_MODERATE"
            action = "Send reminder at Day -3, Day +1, Day +7; suspend auto-renewals at Day +15"
        else:
            tier = "TIER_3_HIGH"
            action = "Daily multi-channel outreach; enforce credit hold at Day +10"

        return CustomerRiskProfile(
            customer_name=customer_name,
            dso_days=dso_days,
            risk_score=round(score, 1),
            risk_tier=tier,
            recommended_dunning_action=action,
            credit_limit=100000.0 if tier != "TIER_3_HIGH" else 25000.0
        )

    def match_cash_application(
        self, tenant_id: UUID, bank_remittance_id: str, amount: float, reference: Optional[str], open_invoices: List[Dict[str, Any]]
    ) -> CashAppMatchResult:
        # Step 1: Exact Reference Match
        if reference:
            for inv in open_invoices:
                if inv.get("invoice_number") == reference:
                    inv_amt = float(inv.get("total_amount", 0.0))
                    if abs(inv_amt - amount) < 0.01:
                        return CashAppMatchResult(
                            remittance_id=bank_remittance_id,
                            matched_invoice_number=inv.get("invoice_number"),
                            matched_amount=amount,
                            match_strategy="EXACT_REFERENCE",
                            confidence=1.0,
                            status="MATCHED_AND_CLEARED"
                        )
                    elif amount < inv_amt:
                        return CashAppMatchResult(
                            remittance_id=bank_remittance_id,
                            matched_invoice_number=inv.get("invoice_number"),
                            matched_amount=amount,
                            match_strategy="EXACT_REFERENCE",
                            confidence=0.98,
                            status="SHORT_PAY_DISPUTE"
                        )

        # Step 2: Subset-Sum Bundle Match (Single payment clears multiple invoices)
        accumulated = 0.0
        matched_nums = []
        for inv in open_invoices:
            inv_amt = float(inv.get("total_amount", 0.0))
            if accumulated + inv_amt <= amount + 0.01:
                accumulated += inv_amt
                matched_nums.append(inv.get("invoice_number"))
                if abs(accumulated - amount) < 0.01:
                    return CashAppMatchResult(
                        remittance_id=bank_remittance_id,
                        matched_invoice_number=",".join(matched_nums),
                        matched_amount=amount,
                        match_strategy="SUBSET_SUM_BUNDLE",
                        confidence=0.96,
                        status="MATCHED_AND_CLEARED"
                    )

        return CashAppMatchResult(
            remittance_id=bank_remittance_id,
            matched_invoice_number=None,
            matched_amount=0.0,
            match_strategy="UNMATCHED",
            confidence=0.0,
            status="UNMATCHED_REVIEWS"
        )

    def handle_short_pay_dispute(
        self, tenant_id: UUID, customer_name: str, invoice_number: str, billed_amount: float, paid_amount: float
    ) -> DisputeCase:
        short_pay = billed_amount - paid_amount
        
        # Infer dispute reason (e.g. Sales Tax Exemption or Discount Claim)
        reason = "TAX_EXEMPTION_CLAIMED" if abs(short_pay - (billed_amount * 0.0825)) < 5.0 else "UNAUTHORIZED_EARLY_PAY_DISCOUNT"
        
        auto_memo = True if reason == "TAX_EXEMPTION_CLAIMED" else False
        action = "Issue Tax Exemption Credit Memo for $%.2f" % short_pay if auto_memo else "Route short-pay discrepancy to Account Executive for collection."

        return DisputeCase(
            tenant_id=tenant_id,
            customer_name=customer_name,
            invoice_number=invoice_number,
            billed_amount=billed_amount,
            paid_amount=paid_amount,
            short_pay_amount=round(short_pay, 2),
            inferred_reason=reason,
            suggested_action=action,
            auto_credit_memo_issued=auto_memo
        )
