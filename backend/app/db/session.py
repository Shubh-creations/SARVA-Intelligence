"""Async PostgreSQL engine lifecycle and request-scoped sessions."""
from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.core.errors import InfrastructureError


class Database:
    def __init__(self, settings: Settings) -> None:
        self.engine: AsyncEngine = create_async_engine(
            str(settings.database_url), pool_pre_ping=True, pool_size=5, max_overflow=10
        )
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def check_health(self) -> None:
        try:
            async with self.engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except Exception as exc:
            raise InfrastructureError() from exc

    async def close(self) -> None:
        await self.engine.dispose()

    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
