"""Central authorization vocabulary. Feature code never scatters permission strings."""
from enum import StrEnum


class RoleName(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    FINANCE_MANAGER = "finance_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"


class Permission(StrEnum):
    FORECAST_READ = "forecast.read"
    FORECAST_GENERATE = "forecast.generate"
    TRANSACTION_READ = "transaction.read"
    TRANSACTION_IMPORT = "transaction.import"
    DASHBOARD_READ = "dashboard.read"
    DASHBOARD_EXPORT = "dashboard.export"
    ORGANIZATION_MANAGE = "organization.manage"
    USER_MANAGE = "user.manage"
    SETTINGS_MANAGE = "settings.manage"
    AUDIT_READ = "audit.read"


ROLE_PERMISSIONS: dict[RoleName, frozenset[Permission]] = {
    RoleName.OWNER: frozenset(Permission),
    RoleName.ADMIN: frozenset(Permission),
    RoleName.FINANCE_MANAGER: frozenset({Permission.FORECAST_READ, Permission.FORECAST_GENERATE, Permission.TRANSACTION_READ, Permission.TRANSACTION_IMPORT, Permission.DASHBOARD_READ, Permission.DASHBOARD_EXPORT}),
    RoleName.ANALYST: frozenset({Permission.FORECAST_READ, Permission.TRANSACTION_READ, Permission.DASHBOARD_READ, Permission.DASHBOARD_EXPORT}),
    RoleName.VIEWER: frozenset({Permission.FORECAST_READ, Permission.TRANSACTION_READ, Permission.DASHBOARD_READ}),
}
