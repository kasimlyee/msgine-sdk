import {
  HttpClient,
  MsGineClientConfig,
  MsGineError,
  RequestOptions,
  RetryConfig,
} from './types';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};


export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly timeout: number;
  private readonly fetchImpl: typeof fetch;
  private readonly retryConfig: Required<RetryConfig>;

  constructor(config: MsGineClientConfig) {
    this.baseUrl = config.baseUrl ?? 'https://api.msgine.net/api/v1';
    this.apiToken = config.apiToken;
    this.timeout = config.timeout ?? 30000;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retry,
    };

    // Validate configuration
    if (!this.apiToken) {
      throw new Error('API token is required');
    }
  }

  /**
   * Make an HTTP request with retry logic
   */
  async request<TResponse, TBody = unknown>(
    options: RequestOptions<TBody>
  ): Promise<TResponse> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        return await this.executeRequest<TResponse, TBody>(options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's not a MsGineError or not a retryable status
        if (
          !(error instanceof MsGineError) ||
          !this.retryConfig.retryableStatusCodes.includes(error.statusCode)
        ) {
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= this.retryConfig.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay *
            Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );

        
        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Execute a single HTTP request
   */
  private async executeRequest<TResponse, TBody = unknown>(
    options: RequestOptions<TBody>
  ): Promise<TResponse> {
    const url = this.buildUrl(options.path, options.queryParams);
    const headers = this.buildHeaders(options.headers);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchImpl(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return await this.handleResponse<TResponse>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MsGineError(
          'Request timeout',
          408,
          'REQUEST_TIMEOUT',
          undefined,
          undefined
        );
      }

      // Handle network errors
      if (error instanceof Error) {
        throw new MsGineError(
          `Network error: ${error.message}`,
          0,
          'NETWORK_ERROR',
          undefined,
          undefined
        );
      }

      throw error;
    }
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<TResponse>(
    response: Response
  ): Promise<TResponse> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // Handle successful responses
    if (response.ok) {
      if (isJson) {
        const data = await response.json();
        return data as TResponse;
      }
      throw new MsGineError(
        'Unexpected response format',
        response.status,
        'INVALID_RESPONSE_FORMAT',
        undefined,
        undefined
      );
    }

    // Handle error responses
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;
    let errorDetails: Record<string, unknown> | undefined;
    let requestId: string | undefined;

    if (isJson) {
      try {
        const errorData: any = await response.json();
        errorMessage = errorData.error?.message ?? errorMessage;
        errorCode = errorData.error?.code;
        errorDetails = errorData.error?.details;
        requestId = errorData.meta?.requestId;
      } catch {
        // If parsing fails, use default error message
      }
    }

    throw new MsGineError(
      errorMessage,
      response.status,
      errorCode,
      errorDetails,
      requestId
    );
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    path: string,
    queryParams?: Record<string, string | number | boolean>
  ): string {
    const url = new URL(path, this.baseUrl);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    return {
      Authorization: this.apiToken,
      'Content-Type': 'application/json',
      'User-Agent': '@msgine/sdk/1.0.0',
      ...customHeaders,
    };
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}