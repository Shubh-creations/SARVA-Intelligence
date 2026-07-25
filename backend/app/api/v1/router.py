from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.identity import router as identity_router

router = APIRouter()
router.include_router(health_router)
router.include_router(identity_router)
