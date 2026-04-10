package msgine

import (
	"context"
	"encoding/json"
	"net/url"
)

// MessagesService provides a unified lookup for any message type.
type MessagesService struct {
	t *transport
}

// Get retrieves any message (SMS, email, or push) by its UUID.
// The returned map contains the raw API response; use the Channel field
// to determine the type and cast accordingly.
func (s *MessagesService) Get(ctx context.Context, id string) (map[string]json.RawMessage, error) {
	if id == "" {
		return nil, &ValidationError{Field: "id", Message: "id is required"}
	}
	var result map[string]json.RawMessage
	if err := s.t.do(ctx, "GET", "/developers/"+url.PathEscape(id), nil, nil, &result); err != nil {
		return nil, err
	}
	return result, nil
}
