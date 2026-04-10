"""MsGine SDK type definitions."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

MessageStatus = Literal["pending", "queued", "sent", "delivered", "failed"]
DevicePlatform = Literal["android", "ios", "web"]
Channel = Literal["sms", "email", "push"]


# ── Common ────────────────────────────────────────────────────────────────────

@dataclass
class MessageRecord:
    id: str
    channel: Channel
    to: list[str]
    from_: str
    content: str
    status: MessageStatus
    cost: float
    currency: str
    created_at: str
    subject: str | None = None
    scheduled_at: str | None = None
    sent_at: str | None = None


@dataclass
class PaginatedResult[T]:
    items: list[T]
    total: int
    page: int
    pages: int


# ── SMS ───────────────────────────────────────────────────────────────────────

@dataclass
class SmsMessage(MessageRecord):
    channel: Channel = field(default="sms", init=False)  # type: ignore[assignment]


# ── Email ─────────────────────────────────────────────────────────────────────

@dataclass
class EmailMessage(MessageRecord):
    channel: Channel = field(default="email", init=False)  # type: ignore[assignment]


# ── Push ──────────────────────────────────────────────────────────────────────

@dataclass
class PushMessage:
    id: str
    channel: str
    title: str
    body: str
    recipient_count: int
    success_count: int
    failure_count: int
    status: MessageStatus
    created_at: str
    data: dict[str, str] | None = None
    image_url: str | None = None
    topic: str | None = None
    scheduled_at: str | None = None
    sent_at: str | None = None


@dataclass
class DeviceRegistration:
    id: str
    platform: DevicePlatform
    is_active: bool
    created_at: str


# ── Analytics ─────────────────────────────────────────────────────────────────

@dataclass
class ChannelStats:
    sent: int
    delivered: int
    failed: int
    cost: float


@dataclass
class PushStats:
    sent: int
    failed: int
    partial: int


@dataclass
class AnalyticsTotals:
    sent: int
    delivered: int
    failed: int
    cost: float
    currency: str


@dataclass
class AnalyticsChannels:
    sms: ChannelStats | None = None
    email: ChannelStats | None = None
    push: PushStats | None = None


@dataclass
class AnalyticsOverview:
    period: dict[str, str]
    totals: AnalyticsTotals
    channels: AnalyticsChannels


@dataclass
class DailyDataPoint:
    date: str
    sms: dict[str, Any]
    email: dict[str, Any]
    push: dict[str, Any]


@dataclass
class AnalyticsDaily:
    days: int
    data: list[DailyDataPoint]
