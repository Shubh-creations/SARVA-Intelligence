"""Identity context and organization bootstrap endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthorizationDenied
from app.dependencies.auth import CurrentPrincipal, get_current_principal, require_permission
from app.dependencies.providers import get_db_session
from app.domain.rbac import Permission, RoleName
from app.models.identity import Organization, OrganizationMember, Role
from app.schemas.identity import MeResponse, OrganizationCreate, OrganizationResponse

router = APIRouter(tags=["identity"])


def principal_response(principal: CurrentPrincipal) -> MeResponse:
    organization = principal.membership.organization
    return MeResponse(user_id=principal.user.id, email=principal.user.email, display_name=principal.user.display_name, organization=OrganizationResponse(id=organization.id, name=organization.name, slug=organization.slug, base_currency_code=organization.base_currency_code), role=principal.membership.role.name, permissions=sorted(permission.value for permission in principal.permissions))


@router.get("/me", response_model=MeResponse)
async def me(principal: CurrentPrincipal = Depends(get_current_principal)) -> MeResponse:
    return principal_response(principal)


@router.get("/me/permissions", response_model=list[str])
async def my_permissions(principal: CurrentPrincipal = Depends(get_current_principal)) -> list[str]:
    return sorted(permission.value for permission in principal.permissions)


@router.get("/me/organization", response_model=OrganizationResponse)
async def my_organization(principal: CurrentPrincipal = Depends(get_current_principal)) -> OrganizationResponse:
    organization = principal.membership.organization
    return OrganizationResponse(id=organization.id, name=organization.name, slug=organization.slug, base_currency_code=organization.base_currency_code)


@router.post("/organizations", response_model=OrganizationResponse, status_code=201)
async def create_organization(payload: OrganizationCreate, principal: CurrentPrincipal = Depends(require_permission(Permission.ORGANIZATION_MANAGE)), session: AsyncSession = Depends(get_db_session)) -> OrganizationResponse:
    if principal.membership.role.name not in {RoleName.OWNER, RoleName.ADMIN}:
        raise AuthorizationDenied()
    if await session.scalar(select(Organization).where(Organization.slug == payload.slug)):
        raise AuthorizationDenied()
    owner_role = await session.scalar(select(Role).where(Role.name == RoleName.OWNER))
    if owner_role is None:
        raise AuthorizationDenied()
    organization = Organization(name=payload.name, slug=payload.slug, base_currency_code=payload.base_currency_code.upper())
    session.add(organization)
    await session.flush()
    session.add(OrganizationMember(organization_id=organization.id, user_id=principal.user.id, role_id=owner_role.id))
    await session.commit()
    return OrganizationResponse(id=organization.id, name=organization.name, slug=organization.slug, base_currency_code=organization.base_currency_code)
