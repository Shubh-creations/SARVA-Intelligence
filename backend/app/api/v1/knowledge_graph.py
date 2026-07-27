"""API endpoints for Finance Knowledge Graph Graph-RAG Engine."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, status

from app.domain.knowledge_graph.service import GraphRAGContext, KnowledgeGraphService

router = APIRouter(prefix="/knowledge-graph", tags=["Finance Knowledge Graph"])
kg_service = KnowledgeGraphService()


@router.get("/subgraph-context", response_model=GraphRAGContext, status_code=status.HTTP_200_OK)
async def get_subgraph_context(
    tenant_id: UUID, entity_name: str = "Acme Corp"
) -> GraphRAGContext:
    """Extract multi-hop graph topology and packaging context for LLM agents."""
    return kg_service.extract_subgraph_context(tenant_id=tenant_id, entity_name=entity_name)
