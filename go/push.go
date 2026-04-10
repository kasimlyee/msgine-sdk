package msgine

import (
	"context"
)

// PushService provides methods for sending push notifications and managing devices.
type PushService struct {
	t *transport
}

type sendPushRequest struct {
	Title          string            `json:"title"`
	Body           string            `json:"body"`
	UserIDs        []string          `json:"userIds,omitempty"`
	Topic          string            `json:"topic,omitempty"`
	Data           map[string]string `json:"data,omitempty"`
	ImageURL       string            `json:"imageUrl,omitempty"`
	ScheduledFor   string            `json:"scheduledFor,omitempty"`
	IdempotencyKey string            `json:"idempotencyKey,omitempty"`
}

// Send sends a push notification to a topic or specific users.
//
// Provide either Topic (broadcast) or UserIDs (targeted). If neither is set,
// the notification is sent to all devices registered under the authenticated account.
func (s *PushService) Send(ctx context.Context, opts SendPushOptions) (*PushMessage, error) {
	if opts.Title == "" {
		return nil, &ValidationError{Field: "title", Message: "title is required"}
	}
	if len(opts.Title) > 100 {
		return nil, &ValidationError{Field: "title", Message: "title must be 100 characters or fewer"}
	}
	if opts.Body == "" {
		return nil, &ValidationError{Field: "body", Message: "body is required"}
	}
	if len(opts.Body) > 500 {
		return nil, &ValidationError{Field: "body", Message: "body must be 500 characters or fewer"}
	}

	body := sendPushRequest{
		Title:          opts.Title,
		Body:           opts.Body,
		UserIDs:        opts.UserIDs,
		Topic:          opts.Topic,
		Data:           opts.Data,
		ImageURL:       opts.ImageURL,
		ScheduledFor:   opts.ScheduledFor,
		IdempotencyKey: opts.IdempotencyKey,
	}
	var result PushMessage
	if err := s.t.do(ctx, "POST", "/developers/push", nil, body, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// RegisterDevice registers an FCM device token so it can receive push notifications.
// Registering the same token again is safe (upsert).
func (s *PushService) RegisterDevice(ctx context.Context, opts RegisterDeviceOptions) (*DeviceRegistration, error) {
	if opts.Token == "" {
		return nil, &ValidationError{Field: "token", Message: "token is required"}
	}
	if opts.Platform == "" {
		return nil, &ValidationError{Field: "platform", Message: "platform is required"}
	}

	var result DeviceRegistration
	if err := s.t.do(ctx, "POST", "/developers/push/device", nil, opts, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// RemoveDevice deactivates a device token (e.g. on user logout).
func (s *PushService) RemoveDevice(ctx context.Context, token string) error {
	if token == "" {
		return &ValidationError{Field: "token", Message: "token is required"}
	}
	return s.t.do(ctx, "DELETE", "/developers/push/device", nil, map[string]string{"token": token}, nil)
}

// History returns a paginated list of sent push notifications.
func (s *PushService) History(ctx context.Context, page, limit int) (*PaginatedResult[PushMessage], error) {
	q := queryValues("page", page, "limit", limit)
	var result PaginatedResult[PushMessage]
	if err := s.t.do(ctx, "GET", "/developers/push/history", q, nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}
