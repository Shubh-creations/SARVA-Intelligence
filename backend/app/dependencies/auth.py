"""Reusable current-user, tenant-context, and permission dependencies."""
from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticationError, IdentityClaims, JwtVerifier
from app.core.config import Settings
from app.core.errors import AuthenticationRequired, AuthorizationDenied
from app.dependencies.providers import get_config, get_db_session
from app.domain.rbac import Permission, ROLE_PERMISSIONS, RoleName
from app.models.identity import OrganizationMember, Role, User


@dataclass(frozen=True)
class CurrentPrincipal:
    user: User
    membership: OrganizationMember
    permissions: frozenset[Permission]


async def get_current_principal(
    authorization: str | None = Header(default=None),
    organization_id: UUID | None = Header(default=None, alias="X-Organization-ID"),
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_config),
) -> CurrentPrincipal:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationRequired()
    try:
        claims: IdentityClaims = JwtVerifier(settings).verify(authorization.removeprefix("Bearer ").strip())
    except AuthenticationError as exc:
        raise AuthenticationRequired() from exc
    user = await session.scalar(select(User).where(User.external_subject == claims.subject, User.deleted_at.is_(None)))
    if user is None:
        raise AuthenticationRequired()
    query = select(OrganizationMember).join(Role).where(OrganizationMember.user_id == user.id, OrganizationMember.status == "active")
    if organization_id:
        query = query.where(OrganizationMember.organization_id == organization_id)
    membership = await session.scalar(query)
    if membership is None:
        raise AuthorizationDenied()
    try:
        permissions = ROLE_PERMISSIONS[RoleName(membership.role.name)]
    except ValueError as exc:
        raise AuthorizationDenied() from exc
    return CurrentPrincipal(user=user, membership=membership, permissions=permissions)


def require_permission(permission: Permission):
    async def dependency(principal: CurrentPrincipal = Depends(get_current_principal)) -> CurrentPrincipal:
        if permission not in principal.permissions:
            raise AuthorizationDenied()
        return principal
    return dependency
