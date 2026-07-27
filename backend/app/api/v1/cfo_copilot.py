"""API endpoints for Enterprise CFO Copilot Natural Language Engine."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, status

from app.domain.cfo_copilot.service import BoardDeckReport, CFOCopilotService, CopilotQueryResponse

router = APIRouter(prefix="/cfo-copilot", tags=["CFO Copilot Engine"])
copilot_service = CFOCopilotService()


@router.post("/query", response_model=CopilotQueryResponse, status_code=status.HTTP_200_OK)
async def process_natural_query(
    tenant_id: UUID, query: str = "What is our current projected cash runway?"
) -> CopilotQueryResponse:
    """Process natural language CFO financial query with Text-to-SQL/Graph-RAG routing."""
    return copilot_service.process_natural_query(tenant_id=tenant_id, query=query)


@router.post("/board-deck", response_model=BoardDeckReport, status_code=status.HTTP_200_OK)
async def generate_board_deck(
    tenant_id: UUID, period: str = "Q2 2026"
) -> BoardDeckReport:
    """Generate executive CFO Board Deck report slides with citations."""
    return copilot_service.generate_board_deck(tenant_id=tenant_id, period=period)
