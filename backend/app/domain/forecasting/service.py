"""90-Day Cash Forecasting Engine for FinanceOS MVP.
Computes daily cash balance projections, p10/p50/p90 quantile uncertainty bounds, and What-If scenario simulations.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DailyForecastPoint(BaseModel):
    date: str
    day_index: int
    projected_balance_p50: float
    projected_balance_p10: float
    projected_balance_p90: float
    projected_inflow: float
    projected_outflow: float


class CashForecastResult(BaseModel):
    forecast_id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    horizon_days: int = 90
    starting_balance: float
    ending_balance_p50: float
    min_cash_balance_p10: float
    estimated_runway_days: Optional[int]
    daily_projections: List[DailyForecastPoint]
    drivers_summary: List[Dict[str, Any]]


class WhatIfScenarioParams(BaseModel):
    customer_payment_delay_days: int = 0
    revenue_growth_percent: float = 0.0
    unplanned_expense_spike: float = 0.0
    expense_spike_day: int = 30


class CashForecastingService:
    """Computes multi-horizon cash forecasts and scenario simulations for the First 100 Customers MVP."""

    def generate_90day_forecast(
        self,
        tenant_id: UUID,
        current_balance: float,
        historic_daily_inflow_avg: float = 15000.0,
        historic_daily_outflow_avg: float = 11000.0,
        inflow_volatility_std: float = 2500.0,
        scenario: Optional[WhatIfScenarioParams] = None,
    ) -> CashForecastResult:
        scenario = scenario or WhatIfScenarioParams()
        today = datetime.now(timezone.utc).date()
        
        # Adjust base daily inflow & outflow for scenario
        effective_inflow_avg = historic_daily_inflow_avg * (1.0 + (scenario.revenue_growth_percent / 100.0))
        effective_outflow_avg = historic_daily_outflow_avg

        daily_points: List[DailyForecastPoint] = []
        running_balance_p50 = current_balance
        running_balance_p10 = current_balance
        running_balance_p90 = current_balance
        
        min_p10 = current_balance
        runway_day: Optional[int] = None

        for day_idx in range(1, 91):
            current_date = (today + timedelta(days=day_idx)).strftime("%Y-%m-%d")
            
            # Apply customer payment delay impact to early days
            if day_idx <= scenario.customer_payment_delay_days:
                day_inflow = effective_inflow_avg * 0.3  # Delayed collection factor
            else:
                day_inflow = effective_inflow_avg

            day_outflow = effective_outflow_avg
            
            # Apply one-off expense spike
            if day_idx == scenario.expense_spike_day:
                day_outflow += scenario.unplanned_expense_spike

            net_flow_p50 = day_inflow - day_outflow
            
            # Quantile uncertainty expansion over time (sigma scales with sqrt(day))
            uncertainty_margin = 1.645 * inflow_volatility_std * math.sqrt(day_idx)
            
            running_balance_p50 += net_flow_p50
            running_balance_p10 = running_balance_p50 - uncertainty_margin
            running_balance_p90 = running_balance_p50 + uncertainty_margin

            if running_balance_p10 < min_p10:
                min_p10 = running_balance_p10

            if running_balance_p10 <= 0 and runway_day is None:
                runway_day = day_idx

            point = DailyForecastPoint(
                date=current_date,
                day_index=day_idx,
                projected_balance_p50=round(running_balance_p50, 2),
                projected_balance_p10=round(running_balance_p10, 2),
                projected_balance_p90=round(running_balance_p90, 2),
                projected_inflow=round(day_inflow, 2),
                projected_outflow=round(day_outflow, 2),
            )
            daily_points.append(point)

        drivers = [
            {"driver": "Recurring Subscriptions / ARR", "impact_pct": "+65%", "direction": "INFLOW"},
            {"driver": "Bi-Weekly Corporate Payroll", "impact_pct": "-45%", "direction": "OUTFLOW"},
            {"driver": "Vendor AP Obligations", "impact_pct": "-25%", "direction": "OUTFLOW"},
        ]
        
        if scenario.customer_payment_delay_days > 0:
            drivers.append({
                "driver": f"Customer Delay Shock ({scenario.customer_payment_delay_days} days)",
                "impact_pct": f"-{scenario.customer_payment_delay_days * 3}%",
                "direction": "OUTFLOW_DELAY"
            })

        return CashForecastResult(
            tenant_id=tenant_id,
            horizon_days=90,
            starting_balance=round(current_balance, 2),
            ending_balance_p50=round(running_balance_p50, 2),
            min_cash_balance_p10=round(min_p10, 2),
            estimated_runway_days=runway_day if runway_day else 90,
            daily_projections=daily_points,
            drivers_summary=drivers,
        )
