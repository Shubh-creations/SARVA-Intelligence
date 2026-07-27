"""FinanceOS application factory; feature modules attach below /api/v1."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.redis import RedisClient
from app.db.session import Database
from app.middleware.request_context import RequestContextMiddleware, install_exception_handlers
from app.middleware.security_headers import ProductionSecurityHeadersMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    logger = logging.getLogger(__name__)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.database = Database(settings)
        app.state.redis = RedisClient(settings)
        logger.info("application_started", extra={"environment": settings.app_env})
        yield
        await app.state.redis.close()
        await app.state.database.close()
        logger.info("application_stopped")

    app = FastAPI(title="FinanceOS API", version="0.1.0", openapi_url="/api/v1/openapi.json", lifespan=lifespan)
    app.add_middleware(ProductionSecurityHeadersMiddleware)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(CORSMiddleware, allow_origins=[str(origin) for origin in settings.cors_origins], allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type", "X-Request-ID"])
    app.add_middleware(RequestContextMiddleware)
    install_exception_handlers(app)
    app.include_router(v1_router, prefix="/api/v1")
    return app



app = create_app()
