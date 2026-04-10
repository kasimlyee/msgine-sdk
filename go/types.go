// Package msgine provides a Go client for the MsGine messaging API.
package msgine

// MessageStatus represents the lifecycle state of a message.
type MessageStatus string

const (
	StatusPending   MessageStatus = "pending"
	StatusQueued    MessageStatus = "queued"
	StatusSent      MessageStatus = "sent"
	StatusDelivered MessageStatus = "delivered"
	StatusFailed    MessageStatus = "failed"
)

// DevicePlatform is the OS of a registered push device.
type DevicePlatform string

const (
	PlatformAndroid DevicePlatform = "android"
	PlatformIOS     DevicePlatform = "ios"
	PlatformWeb     DevicePlatform = "web"
)

// Channel identifies the messaging channel used.
type Channel string

const (
	ChannelSMS   Channel = "sms"
	ChannelEmail Channel = "email"
	ChannelPush  Channel = "push"
)

// ── Pagination ────────────────────────────────────────────────────────────────

// PaginationOptions holds common list-query parameters.
type PaginationOptions struct {
	Page  int `json:"page,omitempty"`
	Limit int `json:"limit,omitempty"`
}

// PaginatedResult wraps a paginated list response.
type PaginatedResult[T any] struct {
	Items []T `json:"items"`
	Total int `json:"total"`
	Page  int `json:"page"`
	Pages int `json:"pages"`
}

// ── Messages ──────────────────────────────────────────────────────────────────

// MessageRecord is the common shape returned for SMS and email messages.
type MessageRecord struct {
	ID          string        `json:"id"`
	Channel     Channel       `json:"channel"`
	To          []string      `json:"to"`
	From        string        `json:"from"`
	Content     string        `json:"content"`
	Status      MessageStatus `json:"status"`
	Cost        float64       `json:"cost"`
	Currency    string        `json:"currency"`
	CreatedAt   string        `json:"createdAt"`
	Subject     *string       `json:"subject,omitempty"`
	ScheduledAt *string       `json:"scheduledAt,omitempty"`
	SentAt      *string       `json:"sentAt,omitempty"`
}

// SmsMessage is a MessageRecord specialised for SMS.
type SmsMessage = MessageRecord

// EmailMessage is a MessageRecord specialised for email.
type EmailMessage = MessageRecord

// ── SMS ───────────────────────────────────────────────────────────────────────

// SendSmsOptions holds the parameters for sending an SMS.
type SendSmsOptions struct {
	// To is a list of E.164 phone numbers (e.g. "+256700000000").
	To             []string
	Message        string
	// From is the sender ID (max 11 chars). Defaults to "MsGine".
	From           string
	// ScheduledFor is an optional ISO 8601 datetime for scheduled sending.
	ScheduledFor   string
	IdempotencyKey string
}

// ── Email ─────────────────────────────────────────────────────────────────────

// SendEmailOptions holds the parameters for sending an email.
type SendEmailOptions struct {
	From    string
	// To is a list of recipient email addresses.
	To      []string
	// CC and BCC are optional lists of email addresses.
	CC      []string
	BCC     []string
	Subject string
	// HTML and/or Text body — at least one is required.
	HTML           string
	Text           string
	ScheduledFor   string
	IdempotencyKey string
}

// ── Push ──────────────────────────────────────────────────────────────────────

// SendPushOptions holds parameters for sending a push notification.
type SendPushOptions struct {
	Title    string            `json:"title"`
	Body     string            `json:"body"`
	Topic    string            `json:"topic,omitempty"`
	Tokens   []string          `json:"tokens,omitempty"`
	Data     map[string]string `json:"data,omitempty"`
	ImageURL string            `json:"imageUrl,omitempty"`
}

// PushMessage is the response after a push send.
type PushMessage struct {
	ID             string        `json:"id"`
	Channel        string        `json:"channel"`
	Title          string        `json:"title"`
	Body           string        `json:"body"`
	RecipientCount int           `json:"recipientCount"`
	SuccessCount   int           `json:"successCount"`
	FailureCount   int           `json:"failureCount"`
	Status         MessageStatus `json:"status"`
	CreatedAt      string        `json:"createdAt"`
	Data           map[string]string `json:"data,omitempty"`
	ImageURL       *string       `json:"imageUrl,omitempty"`
	Topic          *string       `json:"topic,omitempty"`
	ScheduledAt    *string       `json:"scheduledAt,omitempty"`
	SentAt         *string       `json:"sentAt,omitempty"`
}

// RegisterDeviceOptions holds parameters for registering a push device.
type RegisterDeviceOptions struct {
	Token    string         `json:"token"`
	Platform DevicePlatform `json:"platform"`
	DeviceID string         `json:"deviceId,omitempty"`
}

// DeviceRegistration is returned after registering a device.
type DeviceRegistration struct {
	ID        string         `json:"id"`
	Platform  DevicePlatform `json:"platform"`
	IsActive  bool           `json:"isActive"`
	CreatedAt string         `json:"createdAt"`
}

// RemoveDeviceOptions holds parameters for removing a push device.
type RemoveDeviceOptions struct {
	Token string `json:"token"`
}

// ── Analytics ─────────────────────────────────────────────────────────────────

// AnalyticsOverviewOptions are the query params for the analytics overview.
// Both fields are optional ISO 8601 date strings (e.g. "2026-01-01").
type AnalyticsOverviewOptions struct {
	From string
	To   string
}

// ChannelStats holds delivery metrics for a single channel.
type ChannelStats struct {
	Sent      int     `json:"sent"`
	Delivered int     `json:"delivered"`
	Failed    int     `json:"failed"`
	Cost      float64 `json:"cost"`
}

// PushStats holds delivery metrics for push notifications.
type PushStats struct {
	Sent    int `json:"sent"`
	Failed  int `json:"failed"`
	Partial int `json:"partial"`
}

// AnalyticsTotals holds aggregate totals across all channels.
type AnalyticsTotals struct {
	Sent      int     `json:"sent"`
	Delivered int     `json:"delivered"`
	Failed    int     `json:"failed"`
	Cost      float64 `json:"cost"`
	Currency  string  `json:"currency"`
}

// AnalyticsChannels holds per-channel stats (nil if channel unused).
type AnalyticsChannels struct {
	SMS   *ChannelStats `json:"sms,omitempty"`
	Email *ChannelStats `json:"email,omitempty"`
	Push  *PushStats    `json:"push,omitempty"`
}

// AnalyticsOverview is the response from GET /analytics/overview.
type AnalyticsOverview struct {
	Period   map[string]string `json:"period"`
	Totals   AnalyticsTotals   `json:"totals"`
	Channels AnalyticsChannels `json:"channels"`
}

// AnalyticsDailyOptions are the query params for daily analytics.
type AnalyticsDailyOptions struct {
	Days int `json:"days,omitempty"`
}

// DailyDataPoint holds metrics for a single day.
type DailyDataPoint struct {
	Date  string                 `json:"date"`
	SMS   map[string]interface{} `json:"sms"`
	Email map[string]interface{} `json:"email"`
	Push  map[string]interface{} `json:"push"`
}

// AnalyticsDaily is the response from GET /analytics/daily.
type AnalyticsDaily struct {
	Days int              `json:"days"`
	Data []DailyDataPoint `json:"data"`
}

// ── Errors ────────────────────────────────────────────────────────────────────

// APIError represents a non-2xx response from the MsGine API.
type APIError struct {
	StatusCode int
	Code       string
	Message    string
	Details    map[string]interface{}
	RequestID  string
}

func (e *APIError) Error() string {
	if e.Code != "" {
		return "[" + e.Code + "] " + e.Message
	}
	return e.Message
}

// ValidationError is raised when client-side validation fails before a request.
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	if e.Field != "" {
		return e.Field + ": " + e.Message
	}
	return e.Message
}
