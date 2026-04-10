package msgine

import (
	"context"
	"net/url"
	"strings"
)

// SMSService provides methods for sending and listing SMS messages.
type SMSService struct {
	t *transport
}

// SendSmsRequest is the payload for sending an SMS.
// To accepts a comma-separated string or use SendSmsOptions.ToList for a slice.
type SendSmsRequest struct {
	To             string `json:"to"`
	Message        string `json:"message"`
	From           string `json:"from,omitempty"`
	ScheduledFor   string `json:"scheduledFor,omitempty"`
	IdempotencyKey string `json:"idempotencyKey,omitempty"`
}

// Send sends one or more SMS messages. The To field should be a comma-separated
// list of E.164 phone numbers (e.g. "+256700000000,+256712345678").
func (s *SMSService) Send(ctx context.Context, opts SendSmsOptions) (*SmsMessage, error) {
	if len(opts.To) == 0 {
		return nil, &ValidationError{Field: "to", Message: "at least one recipient is required"}
	}
	if opts.Message == "" {
		return nil, &ValidationError{Field: "message", Message: "message is required"}
	}
	if len(opts.Message) > 1000 {
		return nil, &ValidationError{Field: "message", Message: "message must be 1000 characters or fewer"}
	}
	if opts.From != "" && len(opts.From) > 11 {
		return nil, &ValidationError{Field: "from", Message: "sender ID must be 11 characters or fewer"}
	}

	body := SendSmsRequest{
		To:             strings.Join(opts.To, ","),
		Message:        opts.Message,
		From:           opts.From,
		ScheduledFor:   opts.ScheduledFor,
		IdempotencyKey: opts.IdempotencyKey,
	}
	var result SmsMessage
	if err := s.t.do(ctx, "POST", "/developers/sms", nil, body, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// History returns a paginated list of sent SMS messages.
func (s *SMSService) History(ctx context.Context, page, limit int) (*PaginatedResult[SmsMessage], error) {
	q := queryValues("page", page, "limit", limit)
	var result PaginatedResult[SmsMessage]
	if err := s.t.do(ctx, "GET", "/developers/sms/history", q, nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// Get returns a single SMS message by ID.
func (s *SMSService) Get(ctx context.Context, id string) (*SmsMessage, error) {
	if id == "" {
		return nil, &ValidationError{Field: "id", Message: "id is required"}
	}
	var result SmsMessage
	if err := s.t.do(ctx, "GET", "/developers/"+url.PathEscape(id), nil, nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}
