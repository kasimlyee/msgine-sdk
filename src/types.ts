import { z } from 'zod';

/**
 * Configuration options for the MsGine client
 */
export interface MsGineClientConfig {
  /**
   * API authentication token
   */
  apiToken: string;

  /**
   * Base API URL
   * @default 'https://api.msgine.net/api/v1'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Custom fetch implementation
   * Useful for testing or custom network handling
   */
  fetch?: typeof fetch;

  /**
   * Retry configuration
   */
  retry?: RetryConfig;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial retry delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum retry delay in milliseconds
   * @default 10000
   */
  maxDelay?: number;

  /**
   * Backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * HTTP status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryableStatusCodes?: number[];
}

/**
 * SMS message payload schema
 */
export const SendSmsSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
});

/**
 * Type for SMS message payload
 */
export type SendSmsPayload = z.infer<typeof SendSmsSchema>;

/**
 * SMS delivery status
 */
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

/**
 * Response from sending an SMS
 */
export interface SendSmsResponse {
  id: string;
  sid: string | null;
  channel: string;
  to: string[];
  from: string;
  content: string;
  status: MessageStatus;
  cost: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

/**
 * Custom error class for MsGine API errors
 */
export class MsGineError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'MsGineError';
    Object.setPrototypeOf(this, MsGineError.prototype);
  }
}

/**
 * Validation error class
 */
export class MsGineValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError
  ) {
    super(message);
    this.name = 'MsGineValidationError';
    Object.setPrototypeOf(this, MsGineValidationError.prototype);
  }
}

/**
 * HTTP methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * Request options
 */
export interface RequestOptions<TBody = unknown> {
  method: HttpMethod;
  path: string;
  body?: TBody;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
}

/**
 * Generic HTTP client interface
 */
export interface HttpClient {
  request<TResponse, TBody = unknown>(
    options: RequestOptions<TBody>
  ): Promise<TResponse>;
}