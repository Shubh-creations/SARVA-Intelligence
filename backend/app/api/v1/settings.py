"""Settings, Audit Log, Teammates & User Data Management Endpoint for Pilot Launch."""
from __future__ import annotations

import time
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/settings", tags=["Settings & User Profile"])


class UserProfileUpdate(BaseModel):
    name: str = Field(..., max_length=100)
    email: str = Field(..., max_length=150)
    company: str = Field(..., max_length=150)
    role: str = Field(..., max_length=100)


class TeammateInvite(BaseModel):
    email: str = Field(..., max_length=150)
    role: str = Field("Viewer", description="Admin, Editor, or Viewer")


class NotificationPreferences(BaseModel):
    email_digest_frequency: str = Field("Daily", description="Daily, Weekly, Realtime, Off")
    shortfall_alert_threshold_usd: float = Field(500000.0)


_USER_PROFILE = {
    "name": "Sarah Jensen",
    "email": "sarah.jensen@acme-enterprise.com",
    "company": "Acme Enterprise Corp",
    "role": "Chief Financial Officer (CFO)"
}

_TEAMMATES = [
    {"name": "Sarah Jensen", "email": "sarah.jensen@acme-enterprise.com", "role": "Owner / Admin", "status": "ACTIVE"},
    {"name": "Alex Mercer", "email": "alex.mercer@acme-enterprise.com", "role": "VP Treasury", "status": "ACTIVE"},
    {"name": "Elena Rostova", "email": "elena.r@acme-enterprise.com", "role": "Financial Analyst (Viewer)", "status": "INVITED"}
]

_CONNECTIONS = [
    {
        "id": "conn-plaid-001",
        "provider": "Plaid Bank Feed",
        "account_name": "JPMorgan Chase Operating Checking (..3371)",
        "status": "CONNECTED",
        "last_sync": "2026-08-02T15:30:00Z"
    },
    {
        "id": "conn-qbo-002",
        "provider": "QuickBooks Online",
        "account_name": "Acme Enterprise QBO Ledger",
        "status": "CONNECTED",
        "last_sync": "2026-08-02T14:45:00Z"
    }
]

_AUDIT_LOG = [
    {"timestamp": "2026-08-02T15:35:00Z", "action": "LOGIN_SUCCESS", "details": "User logged into SarvaFlow Control Room", "ip": "192.168.1.100"},
    {"timestamp": "2026-08-02T14:45:00Z", "action": "EXECUTIVE_REPORT_EXPORT", "details": "Exported CFO Board Deck Report PDF", "ip": "192.168.1.100"},
    {"timestamp": "2026-08-02T12:00:00Z", "action": "NETTING_SETTLEMENT_EXECUTE", "details": "Executed 1-Click Multilateral Netting ($142.5k saved)", "ip": "192.168.1.100"},
    {"timestamp": "2026-08-01T18:20:00Z", "action": "AML_SCREENING", "details": "Screened entity VLADIMIR PETROV (OFAC SDN Hit flagged)", "ip": "192.168.1.100"}
]


@router.get("/profile")
def get_user_profile() -> Dict[str, Any]:
    return _USER_PROFILE


@router.post("/profile")
def update_user_profile(payload: UserProfileUpdate) -> Dict[str, Any]:
    _USER_PROFILE["name"] = payload.name
    _USER_PROFILE["email"] = payload.email
    _USER_PROFILE["company"] = payload.company
    _USER_PROFILE["role"] = payload.role
    return {"status": "SUCCESS", "message": "Profile updated successfully.", "profile": _USER_PROFILE}


@router.get("/teammates")
def list_teammates() -> List[Dict[str, Any]]:
    return _TEAMMATES


@router.post("/teammates/invite")
def invite_teammate(payload: TeammateInvite) -> Dict[str, Any]:
    new_member = {
        "name": payload.email.split("@")[0].replace(".", " ").title(),
        "email": payload.email,
        "role": payload.role,
        "status": "INVITED"
    }
    _TEAMMATES.append(new_member)
    return {"status": "SUCCESS", "message": f"Invitation sent to {payload.email}", "teammates": _TEAMMATES}


@router.get("/connections")
def list_data_connections() -> List[Dict[str, Any]]:
    return _CONNECTIONS


@router.post("/connections/{connection_id}/toggle")
def toggle_connection(connection_id: str) -> Dict[str, Any]:
    for conn in _CONNECTIONS:
        if conn["id"] == connection_id:
            conn["status"] = "DISCONNECTED" if conn["status"] == "CONNECTED" else "CONNECTED"
            conn["last_sync"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            return {"status": "SUCCESS", "connection": conn}
    return {"status": "ERROR", "message": "Connection ID not found"}


@router.get("/audit-log")
def get_audit_log() -> List[Dict[str, Any]]:
    return _AUDIT_LOG


@router.get("/export-data")
def export_user_data(tenant_id: UUID = Query(...)) -> Dict[str, Any]:
    """Generates JSON dump of tenant data for data portability."""
    return {
        "tenant_id": str(tenant_id),
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "user_profile": _USER_PROFILE,
        "teammates": _TEAMMATES,
        "data_connections": _CONNECTIONS,
        "audit_log": _AUDIT_LOG
    }
