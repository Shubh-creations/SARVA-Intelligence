"""Advanced Fintech API endpoints for ISO 20022 SWIFT Clearing, GNN Fraud Scoring, and Voice CFO."""
from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Query, Response

from app.domain.advanced_fintech.fraud_gnn import FraudScoringRequest, GNNFraudDetectionEngine
from app.domain.advanced_fintech.iso20022 import ISO20022Engine, Pacs008PaymentInstruction
from app.domain.advanced_fintech.voice_copilot import VoiceCFOCopilotEngine

router = APIRouter(prefix="/advanced-fintech", tags=["Advanced Fintech Operations"])

_iso20022_engine = ISO20022Engine()
_fraud_engine = GNNFraudDetectionEngine()
_voice_engine = VoiceCFOCopilotEngine()


@router.post("/iso20022-clear")
def generate_pacs008_wire(instruction: Pacs008PaymentInstruction) -> Response:
    """Generates valid ISO 20022 pacs.008 XML interbank wire payload."""
    xml_content = _iso20022_engine.generate_pacs008_xml(instruction)
    return Response(content=xml_content, media_type="application/xml")


@router.post("/fraud-score")
def evaluate_fraud_risk(request: FraudScoringRequest) -> Dict[str, Any]:
    """Evaluates transaction fraud risk score using velocity and device fingerprinting."""
    return _fraud_engine.evaluate_fraud_risk(request)


@router.post("/voice-query")
def execute_voice_query(tenant_id: UUID = Query(...), audio_b64: str = Query("UklGRi...")) -> Dict[str, Any]:
    """Processes hands-free executive voice query and returns synthesized response."""
    return _voice_engine.process_voice_query(tenant_id, audio_b64)
