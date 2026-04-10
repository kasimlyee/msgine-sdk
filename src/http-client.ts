import {
  HttpMethod,
  MsGineClientConfig,
  MsGineError,
  RequestOptions,
  RetryConfig,
} from './types';

const SDK_VERSION = '2.0.0';

const DEFAULT_RETRY: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
  message?: string;
  meta?: { requestId?: string };
}

export class HttpClient {
  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly fetchImpl: typeof fetch;
  private readonly retry: Required<RetryConfig>;

  constructor(config: MsGineClientConfig) {
    if (!config.apiKey) throw new Error('MsGine: apiKey is required');
    this.baseUrl = (config.baseUrl ?? 'https://api.msgine.net/api/v1').replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30_000;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    this.retry = { ...DEFAULT_RETRY, ...config.retry };
  }

  async request<TResponse, TBody = unknown>(
    options: RequestOptions<TBody>,
  ): Promise<TResponse> {
    let lastError!: Error;

    for (let attempt = 0; attempt <= this.retry.maxRetries; attempt++) {
      try {
        return await this.execute<TResponse, TBody>(options);
      } catch (err) {
        lastError = err as Error;
        const isRetryable =
          err instanceof MsGineError &&
          this.retry.retryableStatusCodes.includes(err.statusCode);
        if (!isRetryable || attempt >= this.retry.maxRetries) throw err;

        const delay = Math.min(
          this.retry.initialDelay * Math.pow(this.retry.backoffMultiplier, attempt),
          this.retry.maxDelay,
        );
        await sleep(delay);
      }
    }

    throw lastError;
  }

  private async execute<TResponse, TBody = unknown>(
    options: RequestOptions<TBody>,
  ): Promise<TResponse> {
    const url = this.buildUrl(options.path, options.queryParams);
    const headers = this.buildHeaders(options.headers);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await this.fetchImpl(url, {
        method: options.method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return await this.parseResponse<TResponse>(res);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof MsGineError) throw err;
      if (err instanceof Error && err.name === 'AbortError')
        throw new MsGineError('Request timed out', 408, 'REQUEST_TIMEOUT');
      if (err instanceof Error)
        throw new MsGineError(`Network error: ${err.message}`, 0, 'NETWORK_ERROR');
      throw err;
    }
  }

  private async parseResponse<TResponse>(res: Response): Promise<TResponse> {
    const isJson = res.headers.get('content-type')?.includes('application/json');

    if (res.ok) {
      if (!isJson) throw new MsGineError('Unexpected response format', res.status, 'INVALID_RESPONSE');
      return (await res.json()) as TResponse;
    }

    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;
    let requestId: string | undefined;

    if (isJson) {
      try {
        const body = (await res.json()) as ApiErrorBody;
        message = body.error?.message ?? body.message ?? message;
        code = body.error?.code;
        details = body.error?.details;
        requestId = body.meta?.requestId;
      } catch { /* ignore */ }
    }

    throw new MsGineError(message, res.status, code, details, requestId);
  }

  private buildUrl(
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
  ): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(`${this.baseUrl}/${normalized}`);
    if (queryParams) {
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined) url.searchParams.append(k, String(v));
      }
    }
    return url.toString();
  }

  private buildHeaders(custom?: Record<string, string>): Record<string, string> {
    return {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `@msgine/sdk/${SDK_VERSION}`,
      ...custom,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise string | string[] → comma-separated string expected by the backend */
export function toRecipientString(value: string | string[]): string {
  return Array.isArray(value) ? value.join(',') : value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
