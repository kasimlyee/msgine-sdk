"""MsGine Python SDK — basic usage examples (sync and async)."""
import asyncio

from msgine import MsGineClient, AsyncMsGineClient

API_KEY = "your-api-key-here"


# ── Sync ──────────────────────────────────────────────────────────────────────

def sync_examples() -> None:
    with MsGineClient(api_key=API_KEY) as client:

        # ── SMS ───────────────────────────────────────────────────────────────
        sms = client.sms.send(
            to=["+256700000000", "+256712345678"],
            message="Hello from MsGine!",
            from_="MsGine",
        )
        print(f"SMS sent: {sms.id} — status: {sms.status}")

        # SMS history
        history = client.sms.history(page=1, limit=10)
        print(f"Total SMS: {history.total} across {history.pages} pages")

        # ── Email ─────────────────────────────────────────────────────────────
        email = client.email.send(
            from_="no-reply@mail.msgine.net",
            to=["user@example.com"],
            subject="Welcome to MsGine",
            html="<h1>Hello!</h1><p>Thanks for signing up.</p>",
        )
        print(f"Email sent: {email.id}")

        # Email with plain text fallback
        client.email.send(
            from_="no-reply@mail.msgine.net",
            to="user@example.com",
            subject="Plain text email",
            text="Hello! This is a plain text email.",
        )

        # ── Push Notifications ────────────────────────────────────────────────
        # Register a device token
        device = client.push.register_device(
            token="fcm-device-token-here",
            platform="android",
        )
        print(f"Device registered: {device.id}")

        # Send to a topic (broadcast)
        push = client.push.send(
            title="New message",
            body="You have a new message from MsGine",
            topic="general",
            data={"screen": "inbox"},
        )
        print(f"Push sent — success: {push.success_count}, failed: {push.failure_count}")

        # Send to specific users
        client.push.send(
            title="Order confirmed",
            body="Your order #123 has been confirmed",
            user_ids=["user-uuid-1", "user-uuid-2"],
        )

        # Remove a device token (e.g. on logout)
        client.push.remove_device("fcm-device-token-here")

        # ── Analytics ─────────────────────────────────────────────────────────
        overview = client.analytics.overview(from_="2026-01-01", to="2026-04-06")
        print(f"Period: {overview.period}")
        print(f"Total sent: {overview.totals.sent}, cost: {overview.totals.currency} {overview.totals.cost}")
        if overview.channels.sms:
            print(f"SMS delivered: {overview.channels.sms.delivered}")
        if overview.channels.email:
            print(f"Email delivered: {overview.channels.email.delivered}")
        if overview.channels.push:
            print(f"Push sent: {overview.channels.push.sent}")

        daily = client.analytics.daily(days=7)
        print(f"Daily breakdown for {daily.days} days:")
        for day in daily.data:
            print(f"  {day.date}: SMS={day.sms}, Email={day.email}")

        # ── Messages (unified lookup) ──────────────────────────────────────────
        msg = client.messages.get("message-uuid-here")
        print(f"Message: {msg}")


# ── Async ─────────────────────────────────────────────────────────────────────

async def async_examples() -> None:
    async with AsyncMsGineClient(api_key=API_KEY) as client:

        # SMS
        sms = await client.sms.send(
            to=["+256700000000"],
            message="Async hello from MsGine!",
        )
        print(f"[async] SMS sent: {sms.id}")

        # Email
        email = await client.email.send(
            from_="no-reply@mail.msgine.net",
            to=["user@example.com"],
            subject="Async email",
            html="<p>Sent asynchronously!</p>",
        )
        print(f"[async] Email sent: {email.id}")

        # Push
        push = await client.push.send(
            title="Async notification",
            body="This was sent asynchronously",
            topic="alerts",
        )
        print(f"[async] Push sent: success={push.success_count}")

        # Analytics
        overview = await client.analytics.overview(from_="2026-01-01")
        print(f"[async] Total cost: {overview.totals.currency} {overview.totals.cost:.4f}")

        # Concurrent requests
        sms_hist, email_hist = await asyncio.gather(
            client.sms.history(page=1, limit=5),
            client.email.history(page=1, limit=5),
        )
        print(f"[async] SMS history: {sms_hist.total}, Email history: {email_hist.total}")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Sync examples ===")
    sync_examples()

    print("\n=== Async examples ===")
    asyncio.run(async_examples())
