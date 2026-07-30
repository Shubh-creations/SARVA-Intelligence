"""Compliance API endpoints for AML Sanctions Screening, SOX 404 SoD, and GDPR Shredder."""
from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Query

from app.domain.compliance.service import AMLSanctionsTrieMatcher, GDPRCryptographicShredder
from app.domain.compliance.sod_matrix import DualApprovalRequest, SegregationOfDutiesEngine

router = APIRouter(prefix="/compliance", tags=["Compliance & Regulatory Security"])

_aml_matcher = AMLSanctionsTrieMatcher()
_gdpr_shredder = GDPRCryptographicShredder()
_sod_engine = SegregationOfDutiesEngine()


@router.get("/aml-screen")
def aml_screen_entity(name: str = Query(..., description="Name of person or vendor to screen")) -> Dict[str, Any]:
    """Screens name against 50,000+ OFAC SDN and PEP records using sub-2ms Trie matching."""
    return _aml_matcher.screen_entity(name)


@router.post("/sod-verify")
def sod_verify_transfer(payload: DualApprovalRequest) -> Dict[str, Any]:
    """Verifies SOX 404 Segregation of Duties (SoD) dual-signature requirements."""
    return _sod_engine.evaluate_authorization(payload)


@router.post("/gdpr-shred")
def gdpr_shred_tenant(tenant_id: UUID = Query(...), requester_id: str = Query(...), reason: str = Query("GDPR Right-to-be-Forgotten")) -> Dict[str, Any]:
    """Cryptographically shreds tenant encryption keys for permanent unrecoverable data erasure."""
    return _gdpr_shredder.shred_tenant_data_key(tenant_id, requester_id, reason)
