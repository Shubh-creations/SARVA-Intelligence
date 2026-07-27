"""API endpoints for AI Financial Recommendation Engine."""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, status

from app.domain.recommendations.service import FinancialRecommendation, RecommendationEngineService

router = APIRouter(prefix="/recommendations", tags=["AI Recommendation Engine"])
rec_service = RecommendationEngineService()


@router.get("/", response_model=List[FinancialRecommendation], status_code=status.HTTP_200_OK)
async def get_financial_recommendations(
    tenant_id: UUID
) -> List[FinancialRecommendation]:
    """Retrieve multi-criteria financial recommendations across liquidity, discounts, and yields."""
    return rec_service.generate_recommendations(tenant_id=tenant_id)
