package msgine

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const (
	sdkVersion     = "2.0.0"
	defaultBaseURL = "https://api.msgine.net/api/v1"
	defaultTimeout = 30 * time.Second
)

var retryableStatus = map[int]bool{
	408: true, 429: true,
	500: true, 502: true, 503: true, 504: true,
}

// transport is the internal HTTP client.
type transport struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	maxRetries int
}

func newTransport(apiKey, baseURL string, timeout time.Duration, maxRetries int) *transport {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	// strip trailing slash
	for len(baseURL) > 0 && baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}
	return &transport{
		apiKey:  apiKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
		maxRetries: maxRetries,
	}
}

func (t *transport) do(ctx context.Context, method, path string, query url.Values, body interface{}, out interface{}) error {
	fullURL := t.baseURL + path
	if len(query) > 0 {
		fullURL += "?" + query.Encode()
	}

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("msgine: marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	var lastErr error
	for attempt := 0; attempt <= t.maxRetries; attempt++ {
		if attempt > 0 {
			delay := time.Duration(math.Min(float64(time.Second)*math.Pow(2, float64(attempt-1)), float64(10*time.Second)))
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(delay):
			}
		}

		// Reset body reader on retry
		if seeker, ok := bodyReader.(io.Seeker); ok {
			_, _ = seeker.Seek(0, io.SeekStart)
		}

		req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
		if err != nil {
			return fmt.Errorf("msgine: create request: %w", err)
		}

		req.Header.Set("X-Api-Key", t.apiKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "msgine-go/"+sdkVersion)

		resp, err := t.httpClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		if retryableStatus[resp.StatusCode] && attempt < t.maxRetries {
			resp.Body.Close()
			lastErr = &APIError{StatusCode: resp.StatusCode, Message: fmt.Sprintf("HTTP %d", resp.StatusCode)}
			continue
		}

		defer resp.Body.Close()
		return parseResponse(resp, out)
	}
	return lastErr
}

func parseResponse(resp *http.Response, out interface{}) error {
	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("msgine: read response body: %w", err)
	}

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if out == nil || len(rawBody) == 0 {
			return nil
		}
		// Unwrap data envelope if present
		var envelope struct {
			Data json.RawMessage `json:"data"`
		}
		if json.Unmarshal(rawBody, &envelope) == nil && envelope.Data != nil {
			return json.Unmarshal(envelope.Data, out)
		}
		return json.Unmarshal(rawBody, out)
	}

	// Error path
	apiErr := &APIError{StatusCode: resp.StatusCode, Message: "HTTP " + strconv.Itoa(resp.StatusCode)}
	var body map[string]json.RawMessage
	if json.Unmarshal(rawBody, &body) == nil {
		if errRaw, ok := body["error"]; ok {
			var errObj struct {
				Message string                 `json:"message"`
				Code    string                 `json:"code"`
				Details map[string]interface{} `json:"details"`
			}
			if json.Unmarshal(errRaw, &errObj) == nil {
				if errObj.Message != "" {
					apiErr.Message = errObj.Message
				}
				apiErr.Code = errObj.Code
				apiErr.Details = errObj.Details
			}
		} else if msgRaw, ok := body["message"]; ok {
			var msg string
			if json.Unmarshal(msgRaw, &msg) == nil && msg != "" {
				apiErr.Message = msg
			}
		}
		if metaRaw, ok := body["meta"]; ok {
			var meta struct {
				RequestID string `json:"requestId"`
			}
			if json.Unmarshal(metaRaw, &meta) == nil {
				apiErr.RequestID = meta.RequestID
			}
		}
	}
	return apiErr
}

// queryValues builds a url.Values map, skipping zero-value ints.
func queryValues(pairs ...interface{}) url.Values {
	q := url.Values{}
	for i := 0; i+1 < len(pairs); i += 2 {
		k, ok := pairs[i].(string)
		if !ok {
			continue
		}
		switch v := pairs[i+1].(type) {
		case string:
			if v != "" {
				q.Set(k, v)
			}
		case int:
			if v != 0 {
				q.Set(k, strconv.Itoa(v))
			}
		}
	}
	return q
}
