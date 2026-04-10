"""Internal HTTP transport for the MsGine Python SDK."""
from __future__ import annotations

import time
from typing import Any

import httpx

from ._exceptions import MsGineError

SDK_VERSION = "2.0.0"
DEFAULT_BASE_URL = "https://api.msgine.net/api/v1"
DEFAULT_TIMEOUT = 30.0
_RETRYABLE = {408, 429, 500, 502, 503, 504}


def _headers(api_key: str) -> dict[str, str]:
    return {
        "X-Api-Key": api_key,
        "Content-Type": "application/json",
        "User-Agent": f"msgine-python/{SDK_VERSION}",
    }


def _raise_for_response(response: httpx.Response) -> None:
    if response.is_success:
        return
    message = f"HTTP {response.status_code}"
    code: str | None = None
    details: dict[str, Any] | None = None
    request_id: str | None = None
    try:
        body = response.json()
        err = body.get("error") or {}
        message = err.get("message") or body.get("message") or message
        code = err.get("code")
        details = err.get("details")
        request_id = body.get("meta", {}).get("requestId")
    except Exception:
        pass
    raise MsGineError(message, response.status_code, code, details, request_id)


# ── Sync ──────────────────────────────────────────────────────────────────────

class SyncTransport:
    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = 3,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._client = httpx.Client(
            base_url=self._base_url,
            headers=_headers(api_key),
            timeout=timeout,
        )

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any = None,
    ) -> Any:
        for attempt in range(self._max_retries + 1):
            response = self._client.request(method, path, params=params, json=json)
            if response.status_code in _RETRYABLE and attempt < self._max_retries:
                time.sleep(min(1.0 * (2**attempt), 10.0))
                continue
            _raise_for_response(response)
            return response.json()
        return None  # unreachable

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "SyncTransport":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


# ── Async ─────────────────────────────────────────────────────────────────────

class AsyncTransport:
    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = 3,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=_headers(api_key),
            timeout=timeout,
        )

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any = None,
    ) -> Any:
        import asyncio

        for attempt in range(self._max_retries + 1):
            response = await self._client.request(method, path, params=params, json=json)
            if response.status_code in _RETRYABLE and attempt < self._max_retries:
                await asyncio.sleep(min(1.0 * (2**attempt), 10.0))
                continue
            _raise_for_response(response)
            return response.json()
        return None  # unreachable

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "AsyncTransport":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()
