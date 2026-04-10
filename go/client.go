// Package msgine provides a Go client for the MsGine messaging API.
//
// All API calls require an API key generated from the MsGine developer dashboard.
// The key is sent via the X-Api-Key header on every request.
//
// # Quick start
//
//	client, err := msgine.NewClient("sk_live_...")
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	// Send an SMS
//	msg, err := client.SMS.Send(ctx, msgine.SendSmsOptions{
//	    To:      []string{"+256700000000"},
//	    Message: "Hello from MsGine!",
//	})
//
//	// Send an email
//	email, err := client.Email.Send(ctx, msgine.SendEmailOptions{
//	    From:    "no-reply@mail.msgine.net",
//	    To:      []string{"user@example.com"},
//	    Subject: "Welcome!",
//	    HTML:    "<h1>Hello</h1>",
//	})
//
//	// Push notification
//	client.Push.RegisterDevice(ctx, msgine.RegisterDeviceOptions{
//	    Token:    fcmToken,
//	    Platform: msgine.PlatformAndroid,
//	})
//	client.Push.Send(ctx, msgine.SendPushOptions{
//	    Title: "New message",
//	    Body:  "You have 1 new message",
//	    Topic: "all-users",
//	})
package msgine

import (
	"errors"
	"time"
)

// ClientConfig holds optional configuration for the MsGine client.
type ClientConfig struct {
	// BaseURL overrides the default API base URL.
	BaseURL string
	// Timeout overrides the default HTTP request timeout (30 s).
	Timeout time.Duration
	// MaxRetries overrides the default number of retries for transient errors (3).
	MaxRetries int
}

// Client is the main entry point for the MsGine SDK.
type Client struct {
	// SMS provides methods for sending and listing SMS messages.
	SMS *SMSService
	// Email provides methods for sending and listing emails.
	Email *EmailService
	// Push provides methods for push notifications and device management.
	Push *PushService
	// Analytics provides methods for querying messaging statistics.
	Analytics *AnalyticsService
	// Messages provides a unified lookup across all message types.
	Messages *MessagesService
}

// NewClient creates a new MsGine client with the given API key.
// Use NewClientWithConfig to customise the base URL, timeout, or retry behaviour.
func NewClient(apiKey string) (*Client, error) {
	return NewClientWithConfig(apiKey, ClientConfig{})
}

// NewClientWithConfig creates a new MsGine client with custom configuration.
func NewClientWithConfig(apiKey string, cfg ClientConfig) (*Client, error) {
	if apiKey == "" {
		return nil, errors.New("msgine: apiKey is required")
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = defaultTimeout
	}

	maxRetries := cfg.MaxRetries
	if maxRetries == 0 {
		maxRetries = 3
	}

	t := newTransport(apiKey, cfg.BaseURL, timeout, maxRetries)

	return &Client{
		SMS:       &SMSService{t: t},
		Email:     &EmailService{t: t},
		Push:      &PushService{t: t},
		Analytics: &AnalyticsService{t: t},
		Messages:  &MessagesService{t: t},
	}, nil
}
