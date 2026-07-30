"""Automated Cash Sweep and 5.2% MMF Yield Arbitrage Allocator."""
from __future__ import annotations

from typing import Any, Dict
from uuid import UUID


class LiquiditySweepArbitrageEngine:
    """Calculates operational buffer targets and daily interest earnings for 1-click cash sweeps."""

    MMF_YIELD_ANNUAL_PCT = 5.2  # 5.2% Annualized MMF Yield

    def calculate_sweep_summary(self, tenant_id: UUID, total_liquid_cash_usd: float = 42500000.0, required_op_buffer_usd: float = 12500000.0) -> Dict[str, Any]:
        sweepable_cash = max(0.0, total_liquid_cash_usd - required_op_buffer_usd)
        daily_yield_usd = round(sweepable_cash * (self.MMF_YIELD_ANNUAL_PCT / 100.0) / 365.0, 2)
        annual_yield_usd = round(sweepable_cash * (self.MMF_YIELD_ANNUAL_PCT / 100.0), 2)

        return {
            "tenant_id": str(tenant_id),
            "user_summary": f"Sweep ${sweepable_cash / 1000000:.1f}M excess cash to 5.2% MMF. Earn +${daily_yield_usd:,.0f}/day interest.",
            "total_liquid_cash_usd": total_liquid_cash_usd,
            "operating_buffer_usd": required_op_buffer_usd,
            "sweepable_cash_usd": sweepable_cash,
            "annual_yield_pct": self.MMF_YIELD_ANNUAL_PCT,
            "estimated_daily_yield_usd": daily_yield_usd,
            "estimated_annual_yield_usd": annual_yield_usd,
            "recommended_destination": "JPMorgan Institutional Treasury MMF (Ticker: JGMXX)",
            "status": "SWEEP_RECOMMENDED"
        }
