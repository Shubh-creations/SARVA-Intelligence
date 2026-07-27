"""API endpoints for 90-Day Cash Forecasting & What-If Simulations."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, status

from app.domain.forecasting.service import (
    CashForecastingService,
    CashForecastResult,
    WhatIfScenarioParams,
)

router = APIRouter(prefix="/forecasting", tags=["Predictive Forecasting"])
forecasting_service = CashForecastingService()


@router.post("/90-day", response_model=CashForecastResult, status_code=status.HTTP_200_OK)
async def generate_90_day_forecast(
    tenant_id: UUID,
    current_balance: float = 2500000.00,
    daily_inflow_avg: float = 25000.00,
    daily_outflow_avg: float = 18000.00,
    scenario: Optional[WhatIfScenarioParams] = None,
) -> CashForecastResult:
    """Generate a 90-day cash forecast with p10/p50/p90 quantile bounds."""
    return forecasting_service.generate_90day_forecast(
        tenant_id=tenant_id,
        current_balance=current_balance,
        historic_daily_inflow_avg=daily_inflow_avg,
        historic_daily_outflow_avg=daily_outflow_avg,
        scenario=scenario,
    )
