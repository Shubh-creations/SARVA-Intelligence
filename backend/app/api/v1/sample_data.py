"""API Endpoints for 16 Ready-to-Use Enterprise Document Scenarios & Master Health Scorecard."""
from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Query

from app.domain.cfo_copilot.health_score import FinancialHealthScorecardEngine
from app.domain.connectors.sample_documents import SampleScenarioEngine

router = APIRouter(prefix="/sample-data", tags=["Enterprise Document Scenarios & Health Scorecard"])

_scenario_engine = SampleScenarioEngine()
_health_engine = FinancialHealthScorecardEngine()


@router.get("/scenarios")
def list_enterprise_scenarios() -> List[Dict[str, Any]]:
    """Lists all 16 production-grade enterprise financial document scenarios."""
    return _scenario_engine.list_scenarios()


@router.get("/scenarios/{scenario_id}")
def get_enterprise_scenario(scenario_id: str) -> Dict[str, Any]:
    """Retrieves full document payload and analytical breakdown for a specific scenario."""
    return _scenario_engine.get_scenario_by_id(scenario_id)


@router.get("/health-scorecard")
def get_health_scorecard(tenant_id: UUID = Query(...)) -> Dict[str, Any]:
    """Returns overall enterprise financial health rating (0-100) & master optimization opportunity."""
    return _health_engine.calculate_health_scorecard(tenant_id)


@router.post("/master-optimize")
def execute_master_optimization(tenant_id: UUID = Query(...)) -> Dict[str, Any]:
    """Executes 1-Click Master Business Optimization across Yield, Netting, Discounts, and Risk."""
    return _health_engine.execute_master_optimization(tenant_id)
