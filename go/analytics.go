package msgine

import (
	"context"
)

// AnalyticsService provides methods for querying messaging statistics.
type AnalyticsService struct {
	t *transport
}

// Overview returns aggregated messaging stats across all channels.
//
// Both From and To are optional ISO 8601 date strings (e.g. "2026-01-01").
// If omitted the API returns stats for the last 30 days.
func (s *AnalyticsService) Overview(ctx context.Context, opts AnalyticsOverviewOptions) (*AnalyticsOverview, error) {
	q := queryValues("from", opts.From, "to", opts.To)
	var result AnalyticsOverview
	if err := s.t.do(ctx, "GET", "/developers/analytics/overview", q, nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// Daily returns per-day message volume for the last N days (1–90, default 30).
func (s *AnalyticsService) Daily(ctx context.Context, days int) (*AnalyticsDaily, error) {
	if days < 1 || days > 90 {
		return nil, &ValidationError{Field: "days", Message: "days must be between 1 and 90"}
	}
	q := queryValues("days", days)
	var result AnalyticsDaily
	if err := s.t.do(ctx, "GET", "/developers/analytics/daily", q, nil, &result); err != nil {
		return nil, err
	}
	return &result, nil
}
