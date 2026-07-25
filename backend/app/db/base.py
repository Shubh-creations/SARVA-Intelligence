"""SQLAlchemy declarative base reserved for future persistence mappings."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import mappings so Alembic discovers metadata before autogeneration/migration execution.
from app.models import identity as identity_models  # noqa: E402,F401
