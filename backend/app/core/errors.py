"""Stable error types exposed at application boundaries."""
from __future__ import annotations


class AppError(Exception):
    status_code = 500
    code = "internal_error"
    message = "An unexpected error occurred."


class InfrastructureError(AppError):
    status_code = 503
    code = "dependency_unavailable"
    message = "A required service is temporarily unavailable."


class AuthenticationRequired(AppError):
    status_code = 401
    code = "authentication_required"
    message = "Valid authentication is required."


class AuthorizationDenied(AppError):
    status_code = 403
    code = "authorization_denied"
    message = "You do not have permission to perform this action."
