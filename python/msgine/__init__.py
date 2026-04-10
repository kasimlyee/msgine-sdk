"""MsGine Python SDK — SMS, Email, and Push Notifications."""
from __future__ import annotations

from ._client import AsyncMsGineClient, MsGineClient
from ._exceptions import MsGineError, MsGineValidationError
from ._types import (
    AnalyticsChannels,
    AnalyticsDaily,
    AnalyticsDailyOptions,
    AnalyticsOverview,
    AnalyticsTotals,
    Channel,
    ChannelStats,
    DailyDataPoint,
    DevicePlatform,
    DeviceRegistration,
    EmailMessage,
    MessageRecord,
    MessageStatus,
    PaginatedResult,
    PushMessage,
    PushStats,
    SmsMessage,
)

__all__ = [
    # Clients
    "MsGineClient",
    "AsyncMsGineClient",
    # Exceptions
    "MsGineError",
    "MsGineValidationError",
    # Types
    "Channel",
    "DevicePlatform",
    "MessageStatus",
    "MessageRecord",
    "SmsMessage",
    "EmailMessage",
    "PushMessage",
    "DeviceRegistration",
    "PaginatedResult",
    "AnalyticsOverview",
    "AnalyticsTotals",
    "AnalyticsChannels",
    "ChannelStats",
    "PushStats",
    "AnalyticsDaily",
    "AnalyticsDailyOptions",
    "DailyDataPoint",
]

__version__ = "2.0.0"
