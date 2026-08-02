"""Feedback & Issue Reporting API Endpoint for Pilot Users."""
from __future__ import annotations

import time
from typing import Any, Dict, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/feedback", tags=["Feedback & Issue Reporting"])


class FeedbackSubmission(BaseModel):
    category: str = Field(..., description="Category: bug, feature, UX, compliance_question")
    subject: str = Field(..., max_length=150)
    description: str = Field(..., max_length=2000)
    user_email: str | None = None
    page_url: str | None = None


_IN_MEMORY_FEEDBACK: List[Dict[str, Any]] = [
    {
        "id": "fb-001",
        "category": "UX",
        "subject": "Clear indicator on demo wire clearing",
        "description": "Love the speed of ISO 20022 wire simulation, great to see clear demo labeling.",
        "user_email": "pilot.user@acme.com",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
]


@router.post("/submit")
def submit_feedback(payload: FeedbackSubmission, tenant_id: UUID = Query(...)) -> Dict[str, Any]:
    """Submits pilot feedback or issue report."""
    item = {
        "id": f"fb-{uuid4().hex[:6]}",
        "tenant_id": str(tenant_id),
        "category": payload.category,
        "subject": payload.subject,
        "description": payload.description,
        "user_email": payload.user_email or "pilot_user@sarvaflow.com",
        "page_url": payload.page_url or "/",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    _IN_MEMORY_FEEDBACK.append(item)
    return {
        "status": "SUCCESS",
        "message": "Thank you! Your feedback has been received and logged for the SarvaFlow team.",
        "feedback_id": item["id"]
    }


@router.get("/list")
def list_feedback() -> List[Dict[str, Any]]:
    """Returns submitted feedback items."""
    return _IN_MEMORY_FEEDBACK
