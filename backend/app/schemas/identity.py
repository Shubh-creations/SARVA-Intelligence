from uuid import UUID

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=100)
    base_currency_code: str = Field(default="USD", min_length=3, max_length=3)


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    base_currency_code: str


class MeResponse(BaseModel):
    user_id: UUID
    email: str
    display_name: str | None
    organization: OrganizationResponse
    role: str
    permissions: list[str]
