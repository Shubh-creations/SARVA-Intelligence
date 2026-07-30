"""Tier-1 Operations API Endpoints for Intercompany Netting, Yield Arbitrage, and Debt Covenant Monitoring."""
from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Query

from app.domain.tier1_ops.covenant_monitor import DebtCovenantMonitorEngine
from app.domain.tier1_ops.netting_engine import MultilateralNettingEngine, SubsidiaryObligation
from app.domain.tier1_ops.sweep_arbitrage import LiquiditySweepArbitrageEngine

router = APIRouter(prefix="/tier1-ops", tags=["Tier-1 Institutional Financial Operations"])

_netting_engine = MultilateralNettingEngine()
_sweep_engine = LiquiditySweepArbitrageEngine()
_covenant_engine = DebtCovenantMonitorEngine()


@router.post("/netting-summary")
def calculate_netting_summary(tenant_id: UUID = Query(...), obligations: List[SubsidiaryObligation] = None) -> Dict[str, Any]:
    """Calculates multilateral intercompany netting reduction to eliminate redundant wire fees."""
    if not obligations:
        obligations = [
            SubsidiaryObligation(from_subsidiary="US_Corp", to_subsidiary="UK_Ltd", amount_usd=500000.0),
            SubsidiaryObligation(from_subsidiary="UK_Ltd", to_subsidiary="EU_GmbH", amount_usd=300000.0),
            SubsidiaryObligation(from_subsidiary="EU_GmbH", to_subsidiary="US_Corp", amount_usd=400000.0),
        ]
    return _netting_engine.calculate_netting_summary(tenant_id, obligations)


@router.get("/yield-summary")
def get_yield_sweep_summary(tenant_id: UUID = Query(...)) -> Dict[str, Any]:
    """Calculates 1-click cash sweep recommendations to earn 5.2% MMF yields."""
    return _sweep_engine.calculate_sweep_summary(tenant_id)


@router.get("/covenant-summary")
def get_covenant_health_summary(tenant_id: UUID = Query(...)) -> Dict[str, Any]:
    """Calculates debt covenant ratios (Debt/EBITDA, Interest Coverage) and 180-day headroom."""
    return _covenant_engine.evaluate_covenant_health(tenant_id)
