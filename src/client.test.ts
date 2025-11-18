import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MsGineClient, MsGineError, MsGineValidationError } from '../src';

describe('MsGineClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createClient = () => {
    return new MsGineClient({
      apiToken: 'test-token-123',
      fetch: mockFetch as unknown as typeof fetch,
    });
  };

  describe('sendSms', () => {
    it('should send SMS successfully', async () => {
      const mockResponse = {
        id: '08356d39-3b8d-4ace-afe3-bf497e716d3e',
        sid: null,
        channel: 'sms',
        to: ['+256701521269'],
        from: 'MsGine',
        content: 'Hello from MsGine!',
        status: 'pending',
        cost: 30,
        currency: 'UGX',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const client = createClient();
      const result = await client.sendSms({
        to: '+256701521269',
        message: 'Hello from MsGine!',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/messages/sms');
      expect(options.method).toBe('POST');
      expect(options.headers).toMatchObject({
        Authorization: 'test-token-123',
        'Content-Type': 'application/json',
      });
      expect(JSON.parse(options.body as string)).toEqual({
        to: '+256701521269',
        message: 'Hello from MsGine!',
      });
    });

    it('should validate phone number', async () => {
      const client = createClient();

      await expect(
        client.sendSms({
          to: '',
          message: 'Hello',
        })
      ).rejects.toThrow(MsGineValidationError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate message', async () => {
      const client = createClient();

      await expect(
        client.sendSms({
          to: '+256701521269',
          message: '',
        })
      ).rejects.toThrow(MsGineValidationError);

      await expect(
        client.sendSms({
          to: '+256701521269',
          message: 'a'.repeat(1601),
        })
      ).rejects.toThrow(MsGineValidationError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      // Create separate response objects since json() can only be called once per response
      const createMockErrorResponse = () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid API token',
          },
        }),
      });

      // Mock the response twice since the test calls sendSms twice
      mockFetch
        .mockResolvedValueOnce(createMockErrorResponse())
        .mockResolvedValueOnce(createMockErrorResponse());

      const client = createClient();

      await expect(
        client.sendSms({
          to: '+256701521269',
          message: 'Hello',
        })
      ).rejects.toThrow(MsGineError);

      try {
        await client.sendSms({
          to: '+256701521269',
          message: 'Hello',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(MsGineError);
        const msGineError = error as MsGineError;
        expect(msGineError.statusCode).toBe(401);
        expect(msGineError.code).toBe('UNAUTHORIZED');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const client = createClient();

      await expect(
        client.sendSms({
          to: '+256701521269',
          message: 'Hello',
        })
      ).rejects.toThrow(MsGineError);
    });

    it('should handle timeout', async () => {
      vi.useFakeTimers();

      try {
        mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
          return new Promise((_, reject) => {
            // Listen to abort signal and reject with AbortError
            const signal = options?.signal as AbortSignal | undefined;
            if (signal) {
              signal.addEventListener('abort', () => {
                const error = new Error('The operation was aborted');
                error.name = 'AbortError';
                reject(error);
              });
            }
            // Never resolve - simulate a hung connection
          });
        });

        const client = new MsGineClient({
          apiToken: 'test-token',
          timeout: 50,
          fetch: mockFetch as unknown as typeof fetch,
        });

        const sendPromise = client.sendSms({
          to: '+256701521269',
          message: 'Hello',
        });

        // Catch the promise to prevent unhandled rejection
        sendPromise.catch(() => {});

        // Run all pending timers
        await vi.runAllTimersAsync();

        await expect(sendPromise).rejects.toThrow('Request timeout');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should retry on retryable errors', async () => {
      // First two calls fail with 503, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({
            id: 'msg_123',
            sid: null,
            channel: 'sms',
            to: ['+256701521269'],
            from: 'MsGine',
            content: 'Hello',
            status: 'pending',
            cost: 30,
            currency: 'UGX',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        });

      const client = new MsGineClient({
        apiToken: 'test-token',
        fetch: mockFetch as unknown as typeof fetch,
        retry: {
          maxRetries: 2,
          initialDelay: 10,
        },
      });

      const result = await client.sendSms({
        to: '+256701521269',
        message: 'Hello',
      });

      expect(result.id).toBe('msg_123');
      expect(result.status).toBe('pending');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendSmsBatch', () => {
    it('should send multiple SMS messages', async () => {
      const mockResponse1 = {
        id: 'msg_1',
        sid: null,
        channel: 'sms',
        to: ['+256701521269'],
        from: 'MsGine',
        content: 'Hello 1',
        status: 'pending',
        cost: 30,
        currency: 'UGX',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse2 = {
        id: 'msg_2',
        sid: null,
        channel: 'sms',
        to: ['+256701521270'],
        from: 'MsGine',
        content: 'Hello 2',
        status: 'pending',
        cost: 30,
        currency: 'UGX',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResponse2),
        });

      const client = createClient();
      const results = await client.sendSmsBatch([
        { to: '+256701521269', message: 'Hello 1' },
        { to: '+256701521270', message: 'Hello 2' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResponse1);
      expect(results[1]).toEqual(mockResponse2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should validate all payloads before sending', async () => {
      const client = createClient();

      await expect(
        client.sendSmsBatch([
          { to: '+256701521269', message: 'Valid' },
          { to: '', message: 'Invalid' },
        ])
      ).rejects.toThrow(MsGineValidationError);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should require API token', () => {
      expect(() => {
        new MsGineClient({
          apiToken: '',
        });
      }).toThrow('API token is required');
    });

    it('should use custom base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () =>
          Promise.resolve({
            success: true,
            messageId: 'msg_123',
            status: 'pending',
            to: '+256701521269',
            timestamp: '2024-01-01T00:00:00Z',
          }),
      });

      const client = new MsGineClient({
        apiToken: 'test-token',
        baseUrl: 'https://custom.api.com/v2',
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.sendSms({
        to: '+256701521269',
        message: 'Hello',
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('https://custom.api.com/v2');
    });
  });
});
