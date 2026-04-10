package main

import (
	"context"
	"fmt"
	"log"

	msgine "github.com/kasimlyee/msgine-sdk/go"
)

const apiKey = "your-api-key-here"

func main() {
	client, err := msgine.NewClient(apiKey)
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()

	// ── SMS ───────────────────────────────────────────────────────────────────
	sms, err := client.SMS.Send(ctx, msgine.SendSmsOptions{
		To:      []string{"+256700000000", "+256712345678"},
		Message: "Hello from MsGine!",
		From:    "MsGine",
	})
	if err != nil {
		log.Printf("SMS error: %v", err)
	} else {
		fmt.Printf("SMS sent: id=%s status=%s\n", sms.ID, sms.Status)
	}

	// SMS history
	history, err := client.SMS.History(ctx, 1, 10)
	if err != nil {
		log.Printf("SMS history error: %v", err)
	} else {
		fmt.Printf("Total SMS: %d across %d pages\n", history.Total, history.Pages)
	}

	// ── Email ─────────────────────────────────────────────────────────────────
	email, err := client.Email.Send(ctx, msgine.SendEmailOptions{
		From:    "no-reply@mail.msgine.net",
		To:      []string{"user@example.com"},
		Subject: "Welcome to MsGine",
		HTML:    "<h1>Hello!</h1><p>Thanks for signing up.</p>",
	})
	if err != nil {
		log.Printf("Email error: %v", err)
	} else {
		fmt.Printf("Email sent: id=%s\n", email.ID)
	}

	// Email with plain text
	_, err = client.Email.Send(ctx, msgine.SendEmailOptions{
		From:    "no-reply@mail.msgine.net",
		To:      []string{"user@example.com"},
		Subject: "Plain text email",
		Text:    "Hello! This is a plain text email.",
	})
	if err != nil {
		log.Printf("Email (text) error: %v", err)
	}

	// ── Push Notifications ────────────────────────────────────────────────────
	// Register a device
	device, err := client.Push.RegisterDevice(ctx, msgine.RegisterDeviceOptions{
		Token:    "fcm-device-token-here",
		Platform: msgine.PlatformAndroid,
	})
	if err != nil {
		log.Printf("Register device error: %v", err)
	} else {
		fmt.Printf("Device registered: id=%s platform=%s\n", device.ID, device.Platform)
	}

	// Send to a topic
	push, err := client.Push.Send(ctx, msgine.SendPushOptions{
		Title: "New message",
		Body:  "You have a new message from MsGine",
		Topic: "general",
		Data:  map[string]string{"screen": "inbox"},
	})
	if err != nil {
		log.Printf("Push error: %v", err)
	} else {
		fmt.Printf("Push sent — success: %d, failed: %d\n", push.SuccessCount, push.FailureCount)
	}

	// Send to specific users
	_, err = client.Push.Send(ctx, msgine.SendPushOptions{
		Title:   "Order confirmed",
		Body:    "Your order #123 has been confirmed",
		UserIDs: []string{"user-uuid-1", "user-uuid-2"},
	})
	if err != nil {
		log.Printf("Push (targeted) error: %v", err)
	}

	// Remove a device token
	if err := client.Push.RemoveDevice(ctx, "fcm-device-token-here"); err != nil {
		log.Printf("Remove device error: %v", err)
	}

	// ── Analytics ─────────────────────────────────────────────────────────────
	overview, err := client.Analytics.Overview(ctx, msgine.AnalyticsOverviewOptions{
		From: "2026-01-01",
		To:   "2026-04-06",
	})
	if err != nil {
		log.Printf("Analytics overview error: %v", err)
	} else {
		fmt.Printf("Total sent: %d, cost: %s %.4f\n",
			overview.Totals.Sent, overview.Totals.Currency, overview.Totals.Cost)
		if overview.Channels.SMS != nil {
			fmt.Printf("SMS delivered: %d\n", overview.Channels.SMS.Delivered)
		}
		if overview.Channels.Email != nil {
			fmt.Printf("Email delivered: %d\n", overview.Channels.Email.Delivered)
		}
		if overview.Channels.Push != nil {
			fmt.Printf("Push sent: %d\n", overview.Channels.Push.Sent)
		}
	}

	daily, err := client.Analytics.Daily(ctx, 7)
	if err != nil {
		log.Printf("Analytics daily error: %v", err)
	} else {
		fmt.Printf("Daily breakdown for %d days:\n", daily.Days)
		for _, day := range daily.Data {
			fmt.Printf("  %s: sms=%v email=%v push=%v\n", day.Date, day.SMS, day.Email, day.Push)
		}
	}

	// ── Message Lookup ────────────────────────────────────────────────────────
	msg, err := client.Messages.Get(ctx, "message-uuid-here")
	if err != nil {
		log.Printf("Message lookup error: %v", err)
	} else {
		fmt.Printf("Message: %v\n", msg)
	}
}
