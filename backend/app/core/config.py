"""Typed, startup-validated application configuration."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, PostgresDsn, RedisDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Immutable settings loaded from environment variables exactly once."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", frozen=True, enable_decoding=False
    )
    app_env: Literal["development", "testing", "production"] = "development"
    log_level: str = "INFO"
    database_url: PostgresDsn
    redis_url: RedisDsn
    allowed_hosts: list[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])
    cors_origins: list[AnyHttpUrl] = Field(default_factory=list)
    rate_limit_per_minute: int = Field(default=120, ge=1, le=10_000)
    jwt_issuer: str = ""
    jwt_audience: str = ""
    jwt_jwks_url: AnyHttpUrl | None = None

    @field_validator("allowed_hosts", "cors_origins", mode="before")
    @classmethod
    def split_comma_separated_values(cls, value: object) -> object:
        """Accept portable comma-separated environment values as well as JSON lists."""
        if isinstance(value, str) and not value.lstrip().startswith("["):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @model_validator(mode="after")
    def validate_identity_configuration(self) -> "Settings":
        if self.is_production and (not self.jwt_issuer or not self.jwt_audience or not self.jwt_jwks_url):
            raise ValueError("JWT_ISSUER, JWT_AUDIENCE, and JWT_JWKS_URL are required in production.")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return validated application settings; invalid configuration stops startup."""
    return Settings()
