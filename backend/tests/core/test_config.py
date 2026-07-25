import os

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_rejects_invalid_environment(monkeypatch):
    monkeypatch.setenv("APP_ENV", "invalid")
    with pytest.raises(ValidationError):
        Settings(database_url="postgresql+asyncpg://a:a@localhost/a", redis_url="redis://localhost:6379/0")
