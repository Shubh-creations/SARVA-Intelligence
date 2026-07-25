from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    service: str = "financeos-api"
    timestamp: datetime
    request_id: str | None = None
