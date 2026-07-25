"""Minimal typed Redis lifecycle wrapper; no cache policy belongs here."""
from __future__ import annotations

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.core.errors import InfrastructureError


class RedisClient:
    def __init__(self, settings: Settings) -> None:
        self.client: Redis = Redis.from_url(str(settings.redis_url), decode_responses=True)

    async def check_health(self) -> None:
        try:
            if not await self.client.ping():
                raise InfrastructureError()
        except RedisError as exc:
            raise InfrastructureError() from exc

    async def close(self) -> None:
        await self.client.aclose()
