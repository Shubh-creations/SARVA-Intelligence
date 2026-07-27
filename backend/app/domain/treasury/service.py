"""AI Treasury Agent Service for FinanceOS MVP.
Handles global multi-bank cash positioning, ZBA cash pooling, MMF yield sweeps, and FX exposure management.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class BankPosition(BaseModel):
    bank_name: str
    account_number_last4: str
    currency: str
    balance: float
    yield_apy_pct: float


class GlobalCashPosition(BaseModel):
    tenant_id: UUID
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    total_liquidity_usd: float
    idle_cash_usd: float
    idle_cash_pct: float
    currency_breakdown: Dict[str, float]
    bank_positions: List[BankPosition]


class TreasurySweepDecision(BaseModel):
    action_type: str  # 'EXECUTE_ZBA_SWEEP', 'EXECUTE_MMF_INVESTMENT', 'HOLD_OPERATING_BUFFER'
    source_account: str
    target_account: str
    amount_usd: float
    estimated_annual_yield_gain_usd: float
    reasoning: str


class TreasuryAgentService:
    """Automates multi-bank liquidity positioning, cash pooling, and yield optimization."""

    def calculate_global_position(
        self, tenant_id: UUID, positions: List[Dict[str, Any]]
    ) -> GlobalCashPosition:
        total_usd = 0.0
        idle_usd = 0.0
        currencies: Dict[str, float] = {}
        bank_list: List[BankPosition] = []

        for p in positions:
            bal = float(p.get("balance", 0.0))
            curr = p.get("currency", "USD")
            apy = float(p.get("yield_apy_pct", 0.0))
            
            total_usd += bal
            if apy < 0.5:  # Zero or near-zero yield operating account
                idle_usd += bal

            currencies[curr] = currencies.get(curr, 0.0) + bal
            bank_list.append(BankPosition(
                bank_name=p.get("bank_name", "Primary Bank"),
                account_number_last4=p.get("last4", "9901"),
                currency=curr,
                balance=bal,
                yield_apy_pct=apy
            ))

        idle_pct = (idle_usd / total_usd * 100.0) if total_usd > 0 else 0.0

        return GlobalCashPosition(
            tenant_id=tenant_id,
            total_liquidity_usd=round(total_usd, 2),
            idle_cash_usd=round(idle_usd, 2),
            idle_cash_pct=round(idle_pct, 1),
            currency_breakdown=currencies,
            bank_positions=bank_list
        )

    def optimize_liquidity_sweeps(
        self, tenant_id: UUID, current_position: GlobalCashPosition, operating_safety_buffer_usd: float = 2000000.0
    ) -> List[TreasurySweepDecision]:
        decisions: List[TreasurySweepDecision] = []

        surplus = current_position.idle_cash_usd - operating_safety_buffer_usd
        if surplus > 100000.0:
            # Recommend overnight Money Market Fund (MMF) sweep earning 5.2% APY
            annual_gain = surplus * 0.052
            decisions.append(TreasurySweepDecision(
                action_type="EXECUTE_MMF_INVESTMENT",
                source_account="JPMorgan Primary Operating",
                target_account="BlackRock Institutional MMF (Yield: 5.20%)",
                amount_usd=round(surplus, 2),
                estimated_annual_yield_gain_usd=round(annual_gain, 2),
                reasoning=f"Surplus idle cash of ${surplus:,.2f} exceeds safety buffer (${operating_safety_buffer_usd:,.2f}). Sweeping to 5.2% MMF yields ${annual_gain:,.2f}/yr."
            ))

        # Check Zero-Balance Account (ZBA) regional sweeps
        for bank in current_position.bank_positions:
            if bank.bank_name != "JPMorgan Primary Operating" and bank.balance > 250000.0:
                sweep_amt = bank.balance - 50000.0
                decisions.append(TreasurySweepDecision(
                    action_type="EXECUTE_ZBA_SWEEP",
                    source_account=f"{bank.bank_name} (*{bank.account_number_last4})",
                    target_account="JPMorgan Master Treasury Account",
                    amount_usd=round(sweep_amt, 2),
                    estimated_annual_yield_gain_usd=round(sweep_amt * 0.045, 2),
                    reasoning=f"ZBA rule: Sweep regional surplus of ${sweep_amt:,.2f} from {bank.bank_name} to Master Treasury."
                ))

        return decisions
