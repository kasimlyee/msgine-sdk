"""MsGine SDK exceptions."""
from __future__ import annotations

from typing import Any


class MsGineError(Exception):
    """Raised when the MsGine API returns a non-2xx response."""

    def __init__(
        self,
        message: str,
        status_code: int,
        code: str | None = None,
        details: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.details = details
        self.request_id = request_id

    def __repr__(self) -> str:
        return (
            f"MsGineError(status_code={self.status_code!r}, "
            f"code={self.code!r}, message={str(self)!r})"
        )


class MsGineValidationError(ValueError):
    """Raised when client-side input validation fails before the request is sent."""

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(message)
        self.field = field
