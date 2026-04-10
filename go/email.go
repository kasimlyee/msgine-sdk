package msgine

import (
	"context"
	"strings"
)

// EmailService provides methods for sending and listing email messages.
type EmailService struct {
	t *transport
}

type sendEmailRequest struct {
	From           string `json:"from"`
	To             string `json:"to"`
	Subject        string `json:"subject"`
	HTML           string `json:"html,omitempty"`
	Text           string `json:"text,omitempty"`
	CC             string `json:"cc,omitempty"`
	BCC            string `json:"bcc,omitempty"`
	ScheduledFor   string `json:"scheduledFor,omitempty"`
	IdempotencyKey string `json:"idempotencyKey,omitempty"`
}

// Send sends an email. At least one of HTML or Text is required.
//
// To, CC, and BCC accept either a single address or a comma-separated string.
// Use the helper JoinAddresses if you have a []string.
func (s *EmailService) Send(ctx context.Context, opts SendEmailOptions) (*EmailMessage, error) {
	if opts.From == "" {
		return nil, &ValidationError{Field: "from", Message: "from is required"}
	}
	if len(opts.To) == 0 {
		return nil, &ValidationError{Field: "to", Message: "at least one recipient is required"}
	}
	if opts.Subject == "" {
		return nil, &ValidationError{Field: "subject", Message: "subject is required"}
	}
	if len(opts.Subject) > 200 {
		return nil, &ValidationError{Field: "subject", Message: "subject must be 200 characters or fewer"}
	}
	if opts.HTML == "" && opts.Text == "" {
		return nil, &ValidationError{Message: "at least one of HTML or Text is required"}
	}

	body := sendEmailRequest{
		From:           opts.From,
		To:             strings.Join(opts.To, ","),
		Subject:        opts.Subject,
		HTML:           opts.HTML,
		Text:           opts.Text,
		ScheduledFor:   opts.ScheduledFor,
		IdempotencyKey: opts.IdempotencyKey,
	}
	if opts.CC != nil {
		body.CC = strings.Join(opts.CC, ",")
	}
	if opts.BCC != nil {
		body.BCC = strings.Join(opts.BCC, ",")
	}

	var result EmailMessage
	if err := s.t.do(ctx, "POST", "/developers/email", nil, body, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// History returns a paginated list of sent emails.
func (s *EmailService) History(ctx context.Context, page, limit int) (*PaginatedResult[EmailMessage], error) {
	q := queryValues("page", page, "limit", limit)
	var result PaginatedResult[EmailMessage]
	if err := s.t.do(ctx, "GET", "/developers/email/history", q, nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}
