"""JSON structured logging with context-variable request correlation."""
from __future__ import annotations

import contextvars
import logging
import sys
from typing import Any

from pythonjsonlogger.json import JsonFormatter

request_id_context: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "request_id", default=None
)


class ContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get() or "-"
        return True


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s"))
    handler.addFilter(ContextFilter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())


def log_event(logger: logging.Logger, event: str, **context: Any) -> None:
    """Write a named JSON event without leaking implementation details."""
    logger.info(event, extra=context)
