"""Provider-neutral JWT verification and normalized identity claims."""
from __future__ import annotations

from dataclasses import dataclass

import jwt
from jwt import PyJWKClient

from app.core.config import Settings


class AuthenticationError(Exception):
    pass


@dataclass(frozen=True)
class IdentityClaims:
    subject: str
    email: str
    name: str | None


class JwtVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.jwks = PyJWKClient(str(settings.jwt_jwks_url)) if settings.jwt_jwks_url else None

    def verify(self, token: str) -> IdentityClaims:
        if not self.jwks or not self.settings.jwt_issuer or not self.settings.jwt_audience:
            raise AuthenticationError("JWT verification is not configured.")
        try:
            key = self.jwks.get_signing_key_from_jwt(token).key
            payload = jwt.decode(token, key, algorithms=["RS256", "ES256"], audience=self.settings.jwt_audience, issuer=self.settings.jwt_issuer, options={"require": ["exp", "sub"]}, leeway=30)
            email = payload.get("email")
            if not isinstance(email, str) or not email:
                raise AuthenticationError("JWT is missing an email claim.")
            return IdentityClaims(subject=str(payload["sub"]), email=email.lower(), name=payload.get("name"))
        except (jwt.PyJWTError, ValueError) as exc:
            raise AuthenticationError("Invalid authentication token.") from exc
