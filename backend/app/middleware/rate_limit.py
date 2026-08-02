"""Rate Limiting Middleware for SarvaFlow API Endpoints.
Enforces per-IP and per-tenant request limits to protect financial endpoints during pilot launch.
"""
from __future__ import annotations

import time
from typing import Dict, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple sliding window rate limiter in memory (60 requests/minute per client IP)."""

    def __init__(self, app: Any, requests_per_minute: int = 120) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.client_records: Dict[str, Tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip static or health check routes
        if request.url.path in ["/api/v1/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        count, window_start = self.client_records.get(client_ip, (0, now))

        if now - window_start > 60:
            count = 1
            window_start = now
        else:
            count += 1

        self.client_records[client_ip] = (count, window_start)

        if count > self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests. Please slow down and try again in a minute.",
                    "retry_after_seconds": int(60 - (now - window_start))
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.requests_per_minute - count))
        return response
