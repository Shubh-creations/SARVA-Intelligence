"""SOX 404 Segregation of Duties (SoD) and Dual-Authorization Approval Engine."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class DualApprovalRequest(BaseModel):
    transaction_id: str
    tenant_id: UUID
    creator_user_id: str
    approver_user_id: Optional[str] = None
    amount_usd: float
    transfer_type: str  # WIRE, ACH, MANUAL_PAYMENT


class SegregationOfDutiesEngine:
    """Enforces SOX 404 dual-signature policies and Segregation of Duties rules."""

    DUAL_APPROVAL_THRESHOLD_USD = 50000.0  # $50,000 threshold requires two distinct signers

    def evaluate_authorization(self, req: DualApprovalRequest) -> Dict[str, Any]:
        # Rule 1: Creator cannot approve their own transfer (SoD Violation)
        if req.approver_user_id and req.creator_user_id == req.approver_user_id:
            return {
                "authorized": False,
                "sod_violation": True,
                "reason": "SOX 404 Segregation of Duties Violation: Creator and Approver cannot be the same user ID.",
                "required_action": "REJECT_AND_FLAG_AUDIT"
            }

        # Rule 2: Transfers > $50,000 require secondary approval
        if req.amount_usd >= self.DUAL_APPROVAL_THRESHOLD_USD and not req.approver_user_id:
            return {
                "authorized": False,
                "sod_violation": False,
                "reason": f"Dual-signature required for transfers exceeding ${self.DUAL_APPROVAL_THRESHOLD_USD:,.2f}.",
                "required_action": "AWAITING_CONTROLLER_SECONDARY_SIGNATURE"
            }

        # Rule 3: Authorized
        return {
            "authorized": True,
            "sod_violation": False,
            "reason": "Transfer complies with SOX 404 Segregation of Duties policies.",
            "required_action": "EXECUTE_PAYMENT"
        }
