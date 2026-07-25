"""Non-business health and readiness endpoints."""
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request

from app.core.redis import RedisClient
from app.db.session import Database
from app.dependencies.providers import get_database, get_redis
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


def response(request: Request) -> HealthResponse:
    return HealthResponse(timestamp=datetime.now(UTC), request_id=getattr(request.state, "request_id", None), status="ok")


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    """Report process health without dependency probes."""
    return response(request)


@router.get("/live", response_model=HealthResponse)
async def live(request: Request) -> HealthResponse:
    """Kubernetes/ECS liveness equivalent: process can serve HTTP."""
    return response(request)


@router.get("/ready", response_model=HealthResponse)
async def ready(request: Request, database: Database = Depends(get_database), redis: RedisClient = Depends(get_redis)) -> HealthResponse:
    """Verify PostgreSQL and Redis before declaring the service ready."""
    await database.check_health()
    await redis.check_health()
    return response(request)
