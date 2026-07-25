"""FastAPI dependency providers kept separate from routes."""
from __future__ import annotations

from collections.abc import AsyncIterator, Callable
from datetime import UTC, datetime

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.redis import RedisClient
from app.db.session import Database


def get_database(request: Request) -> Database:
    return request.app.state.database  # type: ignore[no-any-return]


async def get_db_session(database: Database = Depends(get_database)) -> AsyncIterator[AsyncSession]:
    async for session in database.session():
        yield session


def get_redis(request: Request) -> RedisClient:
    return request.app.state.redis  # type: ignore[no-any-return]


def get_clock() -> Callable[[], datetime]:
    return lambda: datetime.now(UTC)


def get_config() -> Settings:
    return get_settings()
