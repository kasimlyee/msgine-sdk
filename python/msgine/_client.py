"""MsGine Python SDK client."""
from __future__ import annotations

from typing import Any

from ._exceptions import MsGineValidationError
from ._http import AsyncTransport, SyncTransport
from ._http import DEFAULT_BASE_URL, DEFAULT_TIMEOUT
from ._types import (
    AnalyticsDaily,
    AnalyticsOverview,
    AnalyticsTotals,
    AnalyticsChannels,
    ChannelStats,
    DailyDataPoint,
    DeviceRegistration,
    EmailMessage,
    MessageRecord,
    PaginatedResult,
    PushMessage,
    PushStats,
    SmsMessage,
)


def _recipients(value: str | list[str]) -> str:
    if isinstance(value, list):
        return ",".join(value)
    return value


def _msg(raw: dict[str, Any]) -> MessageRecord:
    return MessageRecord(
        id=raw["id"],
        channel=raw.get("channel", "sms"),
        to=raw.get("to", []),
        from_=raw.get("from", ""),
        content=raw.get("content", ""),
        status=raw.get("status", "pending"),
        cost=float(raw.get("cost", 0)),
        currency=raw.get("currency", "UGX"),
        created_at=raw.get("createdAt", ""),
        subject=raw.get("subject"),
        scheduled_at=raw.get("scheduledAt"),
        sent_at=raw.get("sentAt"),
    )


def _push(raw: dict[str, Any]) -> PushMessage:
    return PushMessage(
        id=raw["id"],
        channel=raw.get("channel", "push"),
        title=raw.get("title", ""),
        body=raw.get("body", ""),
        recipient_count=raw.get("recipientCount", 0),
        success_count=raw.get("successCount", 0),
        failure_count=raw.get("failureCount", 0),
        status=raw.get("status", "pending"),
        created_at=raw.get("createdAt", ""),
        data=raw.get("data"),
        image_url=raw.get("imageUrl"),
        topic=raw.get("topic"),
        scheduled_at=raw.get("scheduledAt"),
        sent_at=raw.get("sentAt"),
    )


def _parse_overview(raw: dict[str, Any]) -> AnalyticsOverview:
    t = raw.get("totals", {})
    ch = raw.get("channels", {})

    def _ch(key: str) -> ChannelStats | None:
        d = ch.get(key)
        if not d:
            return None
        return ChannelStats(sent=d.get("sent", 0), delivered=d.get("delivered", 0),
                            failed=d.get("failed", 0), cost=float(d.get("cost", 0)))

    def _push_ch() -> PushStats | None:
        d = ch.get("push")
        if not d:
            return None
        return PushStats(sent=d.get("sent", 0), failed=d.get("failed", 0), partial=d.get("partial", 0))

    return AnalyticsOverview(
        period=raw.get("period", {}),
        totals=AnalyticsTotals(
            sent=t.get("sent", 0), delivered=t.get("delivered", 0),
            failed=t.get("failed", 0), cost=float(t.get("cost", 0)),
            currency=t.get("currency", "UGX"),
        ),
        channels=AnalyticsChannels(sms=_ch("sms"), email=_ch("email"), push=_push_ch()),
    )


def _parse_daily(raw: dict[str, Any]) -> AnalyticsDaily:
    return AnalyticsDaily(
        days=raw.get("days", 30),
        data=[
            DailyDataPoint(
                date=d.get("date", ""),
                sms=d.get("sms", {}),
                email=d.get("email", {}),
                push=d.get("push", {}),
            )
            for d in raw.get("data", [])
        ],
    )


# ── Sync Modules ──────────────────────────────────────────────────────────────

class SmsMethods:
    def __init__(self, http: SyncTransport) -> None:
        self._http = http

    def send(
        self,
        to: str | list[str],
        message: str,
        *,
        from_: str | None = None,
        scheduled_for: str | None = None,
        idempotency_key: str | None = None,
    ) -> SmsMessage:
        if not to:
            raise MsGineValidationError("to is required", "to")
        if not message:
            raise MsGineValidationError("message is required", "message")
        if len(message) > 1000:
            raise MsGineValidationError("message must be 1 000 characters or fewer", "message")

        body: dict[str, Any] = {"to": _recipients(to), "message": message}
        if from_:
            body["from"] = from_
        if scheduled_for:
            body["scheduledFor"] = scheduled_for
        if idempotency_key:
            body["idempotencyKey"] = idempotency_key

        raw = self._http.request("POST", "/developers/sms", json=body)
        return SmsMessage(**{**_msg(raw).__dict__})  # type: ignore[arg-type]

    def history(self, *, page: int = 1, limit: int = 20) -> PaginatedResult[SmsMessage]:
        raw = self._http.request("GET", "/developers/sms/history",
                                 params={"page": page, "limit": limit})
        items = [SmsMessage(**{**_msg(m).__dict__}) for m in raw.get("messages", [])]  # type: ignore[arg-type]
        return PaginatedResult(items=items, total=raw.get("total", 0),
                               page=raw.get("page", page), pages=raw.get("pages", 1))


class EmailMethods:
    def __init__(self, http: SyncTransport) -> None:
        self._http = http

    def send(
        self,
        *,
        from_: str,
        to: str | list[str],
        subject: str,
        html: str | None = None,
        text: str | None = None,
        cc: str | list[str] | None = None,
        bcc: str | list[str] | None = None,
        scheduled_for: str | None = None,
        idempotency_key: str | None = None,
    ) -> EmailMessage:
        if not from_:
            raise MsGineValidationError("from_ is required", "from")
        if not to:
            raise MsGineValidationError("to is required", "to")
        if not subject:
            raise MsGineValidationError("subject is required", "subject")
        if not html and not text:
            raise MsGineValidationError("at least one of html or text is required")

        body: dict[str, Any] = {
            "from": from_, "to": _recipients(to), "subject": subject,
        }
        if html:
            body["html"] = html
        if text:
            body["text"] = text
        if cc:
            body["cc"] = _recipients(cc)
        if bcc:
            body["bcc"] = _recipients(bcc)
        if scheduled_for:
            body["scheduledFor"] = scheduled_for
        if idempotency_key:
            body["idempotencyKey"] = idempotency_key

        raw = self._http.request("POST", "/developers/email", json=body)
        return EmailMessage(**{**_msg(raw).__dict__})  # type: ignore[arg-type]

    def history(self, *, page: int = 1, limit: int = 20) -> PaginatedResult[EmailMessage]:
        raw = self._http.request("GET", "/developers/email/history",
                                 params={"page": page, "limit": limit})
        items = [EmailMessage(**{**_msg(m).__dict__}) for m in raw.get("messages", [])]  # type: ignore[arg-type]
        return PaginatedResult(items=items, total=raw.get("total", 0),
                               page=raw.get("page", page), pages=raw.get("pages", 1))


class PushMethods:
    def __init__(self, http: SyncTransport) -> None:
        self._http = http

    def send(
        self,
        *,
        title: str,
        body: str,
        user_ids: list[str] | None = None,
        topic: str | None = None,
        data: dict[str, str] | None = None,
        image_url: str | None = None,
        scheduled_for: str | None = None,
        idempotency_key: str | None = None,
    ) -> PushMessage:
        if not title:
            raise MsGineValidationError("title is required", "title")
        if not body:
            raise MsGineValidationError("body is required", "body")

        payload: dict[str, Any] = {"title": title, "body": body}
        if user_ids:
            payload["userIds"] = user_ids
        if topic:
            payload["topic"] = topic
        if data:
            payload["data"] = data
        if image_url:
            payload["imageUrl"] = image_url
        if scheduled_for:
            payload["scheduledFor"] = scheduled_for
        if idempotency_key:
            payload["idempotencyKey"] = idempotency_key

        raw = self._http.request("POST", "/developers/push", json=payload)
        return _push(raw)

    def register_device(self, token: str, platform: str) -> DeviceRegistration:
        if not token:
            raise MsGineValidationError("token is required", "token")
        raw = self._http.request("POST", "/developers/push/device",
                                 json={"token": token, "platform": platform})
        return DeviceRegistration(
            id=raw["id"], platform=raw["platform"],
            is_active=raw["isActive"], created_at=raw["createdAt"],
        )

    def remove_device(self, token: str) -> None:
        if not token:
            raise MsGineValidationError("token is required", "token")
        self._http.request("DELETE", "/developers/push/device", json={"token": token})

    def history(self, *, page: int = 1, limit: int = 20) -> PaginatedResult[PushMessage]:
        raw = self._http.request("GET", "/developers/push/history",
                                 params={"page": page, "limit": limit})
        items = [_push(n) for n in raw.get("notifications", [])]
        return PaginatedResult(items=items, total=raw.get("total", 0),
                               page=raw.get("page", page), pages=raw.get("pages", 1))


class AnalyticsMethods:
    def __init__(self, http: SyncTransport) -> None:
        self._http = http

    def overview(self, *, from_: str | None = None, to: str | None = None) -> AnalyticsOverview:
        params: dict[str, Any] = {}
        if from_:
            params["from"] = from_
        if to:
            params["to"] = to
        raw = self._http.request("GET", "/developers/analytics/overview", params=params)
        return _parse_overview(raw)

    def daily(self, *, days: int = 30) -> AnalyticsDaily:
        if not 1 <= days <= 90:
            raise MsGineValidationError("days must be between 1 and 90", "days")
        raw = self._http.request("GET", "/developers/analytics/daily", params={"days": days})
        return _parse_daily(raw)


class MessagesMethods:
    def __init__(self, http: SyncTransport) -> None:
        self._http = http

    def get(self, message_id: str) -> dict[str, Any]:
        if not message_id:
            raise MsGineValidationError("message_id is required")
        return self._http.request("GET", f"/developers/{message_id}")  # type: ignore[return-value]


# ── Async Modules ─────────────────────────────────────────────────────────────

class AsyncSmsMethods:
    def __init__(self, http: AsyncTransport) -> None:
        self._http = http

    async def send(self, to: str | list[str], message: str, **kwargs: Any) -> SmsMessage:
        body: dict[str, Any] = {"to": _recipients(to), "message": message}
        body.update({k: v for k, v in {
            "from": kwargs.get("from_"),
            "scheduledFor": kwargs.get("scheduled_for"),
            "idempotencyKey": kwargs.get("idempotency_key"),
        }.items() if v is not None})
        raw = await self._http.request("POST", "/developers/sms", json=body)
        return SmsMessage(**{**_msg(raw).__dict__})  # type: ignore[arg-type]

    async def history(self, *, page: int = 1, limit: int = 20) -> PaginatedResult[SmsMessage]:
        raw = await self._http.request("GET", "/developers/sms/history",
                                       params={"page": page, "limit": limit})
        items = [SmsMessage(**{**_msg(m).__dict__}) for m in raw.get("messages", [])]  # type: ignore[arg-type]
        return PaginatedResult(items=items, total=raw.get("total", 0),
                               page=raw.get("page", page), pages=raw.get("pages", 1))


class AsyncEmailMethods:
    def __init__(self, http: AsyncTransport) -> None:
        self._http = http

    async def send(self, *, from_: str, to: str | list[str], subject: str,
                   html: str | None = None, text: str | None = None, **kwargs: Any) -> EmailMessage:
        body: dict[str, Any] = {"from": from_, "to": _recipients(to), "subject": subject}
        if html:
            body["html"] = html
        if text:
            body["text"] = text
        for k, v in kwargs.items():
            if v is not None:
                body[k] = v
        raw = await self._http.request("POST", "/developers/email", json=body)
        return EmailMessage(**{**_msg(raw).__dict__})  # type: ignore[arg-type]

    async def history(self, *, page: int = 1, limit: int = 20) -> PaginatedResult[EmailMessage]:
        raw = await self._http.request("GET", "/developers/email/history",
                                       params={"page": page, "limit": limit})
        items = [EmailMessage(**{**_msg(m).__dict__}) for m in raw.get("messages", [])]  # type: ignore[arg-type]
        return PaginatedResult(items=items, total=raw.get("total", 0),
                               page=raw.get("page", page), pages=raw.get("pages", 1))


class AsyncPushMethods:
    def __init__(self, http: AsyncTransport) -> None:
        self._http = http

    async def send(self, *, title: str, body: str, **kwargs: Any) -> PushMessage:
        payload: dict[str, Any] = {"title": title, "body": body}
        payload.update({k: v for k, v in {
            "userIds": kwargs.get("user_ids"),
            "topic": kwargs.get("topic"),
            "data": kwargs.get("data"),
            "imageUrl": kwargs.get("image_url"),
        }.items() if v is not None})
        raw = await self._http.request("POST", "/developers/push", json=payload)
        return _push(raw)

    async def register_device(self, token: str, platform: str) -> DeviceRegistration:
        raw = await self._http.request("POST", "/developers/push/device",
                                       json={"token": token, "platform": platform})
        return DeviceRegistration(id=raw["id"], platform=raw["platform"],
                                   is_active=raw["isActive"], created_at=raw["createdAt"])

    async def remove_device(self, token: str) -> None:
        await self._http.request("DELETE", "/developers/push/device", json={"token": token})

    async def history(self, *, page: int = 1, limit: int = 20) -> PaginatedResult[PushMessage]:
        raw = await self._http.request("GET", "/developers/push/history",
                                       params={"page": page, "limit": limit})
        items = [_push(n) for n in raw.get("notifications", [])]
        return PaginatedResult(items=items, total=raw.get("total", 0),
                               page=raw.get("page", page), pages=raw.get("pages", 1))


class AsyncAnalyticsMethods:
    def __init__(self, http: AsyncTransport) -> None:
        self._http = http

    async def overview(self, *, from_: str | None = None, to: str | None = None) -> AnalyticsOverview:
        params: dict[str, Any] = {}
        if from_:
            params["from"] = from_
        if to:
            params["to"] = to
        raw = await self._http.request("GET", "/developers/analytics/overview", params=params)
        return _parse_overview(raw)

    async def daily(self, *, days: int = 30) -> AnalyticsDaily:
        raw = await self._http.request("GET", "/developers/analytics/daily", params={"days": days})
        return _parse_daily(raw)


# ── Main Clients ──────────────────────────────────────────────────────────────

class MsGineClient:
    """
    Synchronous MsGine SDK client.

    Example::

        from msgine import MsGineClient

        client = MsGineClient(api_key="sk_live_...")

        # SMS
        msg = client.sms.send(to="+256701234567", message="Hello from MsGine!")
        print(msg.id, msg.status)

        # Email
        client.email.send(
            from_="no-reply@mail.msgine.net",
            to="user@example.com",
            subject="Welcome!",
            html="<h1>Hello</h1>",
        )

        # Push
        client.push.register_device(token=fcm_token, platform="android")
        client.push.send(title="New message", body="You have 1 new message")

        # Analytics
        stats = client.analytics.overview(from_="2026-01-01")
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = 3,
    ) -> None:
        if not api_key:
            raise ValueError("MsGine: api_key is required")
        http = SyncTransport(api_key, base_url=base_url, timeout=timeout, max_retries=max_retries)
        self.sms = SmsMethods(http)
        self.email = EmailMethods(http)
        self.push = PushMethods(http)
        self.analytics = AnalyticsMethods(http)
        self.messages = MessagesMethods(http)
        self._http = http

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "MsGineClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


class AsyncMsGineClient:
    """
    Asynchronous MsGine SDK client.

    Example::

        import asyncio
        from msgine import AsyncMsGineClient

        async def main():
            async with AsyncMsGineClient(api_key="sk_live_...") as client:
                msg = await client.sms.send(to="+256701234567", message="Hello!")
                print(msg.id)

        asyncio.run(main())
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = 3,
    ) -> None:
        if not api_key:
            raise ValueError("MsGine: api_key is required")
        http = AsyncTransport(api_key, base_url=base_url, timeout=timeout, max_retries=max_retries)
        self.sms = AsyncSmsMethods(http)
        self.email = AsyncEmailMethods(http)
        self.push = AsyncPushMethods(http)
        self.analytics = AsyncAnalyticsMethods(http)
        self._http = http

    async def close(self) -> None:
        await self._http.close()

    async def __aenter__(self) -> "AsyncMsGineClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()
