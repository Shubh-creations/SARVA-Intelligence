"""API endpoints for AI Treasury Agent Operations."""
from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, status

from app.domain.treasury.service import GlobalCashPosition, TreasuryAgentService, TreasurySweepDecision

router = APIRouter(prefix="/treasury", tags=["AI Treasury Agent"])
treasury_service = TreasuryAgentService()


@router.post("/global-position", response_model=GlobalCashPosition, status_code=status.HTTP_200_OK)
async def calculate_global_position(
    tenant_id: UUID, positions: List[Dict[str, Any]]
) -> GlobalCashPosition:
    """Calculate real-time global multi-bank liquidity position."""
    return treasury_service.calculate_global_position(tenant_id=tenant_id, positions=positions)


@router.post("/optimize-sweeps", response_model=List[TreasurySweepDecision], status_code=status.HTTP_200_OK)
async def optimize_liquidity_sweeps(
    tenant_id: UUID, positions: List[Dict[str, Any]], safety_buffer: float = 2000000.0
) -> List[TreasurySweepDecision]:
    """Generate Zero-Balance Account (ZBA) and MMF yield sweep optimization decisions."""
    pos = treasury_service.calculate_global_position(tenant_id=tenant_id, positions=positions)
    return treasury_service.optimize_liquidity_sweeps(tenant_id=tenant_id, current_position=pos, operating_safety_buffer_usd=safety_buffer)
