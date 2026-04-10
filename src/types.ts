// ─────────────────────────────────────────────────────────────────────────────
// MsGine SDK — Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Config ────────────────────────────────────────────────────────────────────

export interface MsGineClientConfig {
  /** API key (from Developer Portal → Manage Keys) */
  apiKey: string;
  /** Override the base URL. Default: https://api.msgine.net/api/v1 */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30 000 */
  timeout?: number;
  /** Inject a custom fetch (useful for testing). */
  fetch?: typeof fetch;
  /** Retry policy for transient failures. */
  retry?: RetryConfig;
}

export interface RetryConfig {
  /** Max retry attempts. Default: 3 */
  maxRetries?: number;
  /** Initial backoff delay in ms. Default: 1 000 */
  initialDelay?: number;
  /** Maximum backoff delay in ms. Default: 10 000 */
  maxDelay?: number;
  /** Backoff multiplier. Default: 2 */
  backoffMultiplier?: number;
  /** Status codes that trigger a retry. Default: [408, 429, 500, 502, 503, 504] */
  retryableStatusCodes?: number[];
}

// ── Shared primitives ─────────────────────────────────────────────────────────

export type MessageStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed';
export type DevicePlatform = 'android' | 'ios' | 'web';
export type Currency = 'UGX' | 'USD';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  /** Page items */
  items: T[];
  total: number;
  page: number;
  pages: number;
}

/** Shared shape returned for every message channel. */
export interface MessageRecord {
  id: string;
  channel: 'sms' | 'email' | 'push';
  /** Normalised array of recipients */
  to: string[];
  from: string;
  /** Body or subject+body for email */
  content: string;
  subject?: string;
  status: MessageStatus;
  cost: number;
  currency: Currency;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

// ── SMS ───────────────────────────────────────────────────────────────────────

export interface SendSmsOptions {
  /**
   * Recipient phone number(s) in international format.
   * Accepts a single string, comma-separated string, or array.
   * Example: '+256701234567' | ['+256701234567', '+256702345678']
   */
  to: string | string[];
  /** Message content (max 1 000 characters) */
  message: string;
  /** Sender ID, max 11 characters. Default: 'MsGine' */
  from?: string;
  /** ISO 8601 date-time to schedule the message */
  scheduledFor?: string;
  /** Unique key to prevent duplicate sends (max 64 chars) */
  idempotencyKey?: string;
}

export interface SmsMessage extends MessageRecord {
  channel: 'sms';
}

export interface SmsHistoryResult extends PaginatedResult<SmsMessage> {}

// ── Email ─────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  /**
   * Verified sender address.
   * Formats: 'no-reply@mail.msgine.net' or 'Name <email@domain.com>'
   */
  from: string;
  /** Recipient(s) — string, array, or comma-separated */
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  /** Plain-text body */
  text?: string;
  /** HTML body */
  html?: string;
  /** ISO 8601 scheduled send time */
  scheduledFor?: string;
  /** Idempotency key (max 64 chars) */
  idempotencyKey?: string;
}

export interface EmailMessage extends MessageRecord {
  channel: 'email';
  subject: string;
}

export interface EmailHistoryResult extends PaginatedResult<EmailMessage> {}

// ── Push ──────────────────────────────────────────────────────────────────────

export interface SendPushOptions {
  title: string;
  body: string;
  /** Target specific user UUIDs. Omit to target the key-owner's devices. */
  userIds?: string[];
  /** FCM topic (e.g. 'all-users'). Overrides userIds. */
  topic?: string;
  /** Custom data payload — all values must be strings */
  data?: Record<string, string>;
  /** URL of an image to show in the notification */
  imageUrl?: string;
  /** ISO 8601 scheduled send time */
  scheduledFor?: string;
  /** Idempotency key (max 64 chars) */
  idempotencyKey?: string;
}

export interface PushMessage {
  id: string;
  channel: 'push';
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  topic?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: MessageStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface PushHistoryResult extends PaginatedResult<PushMessage> {}

export interface RegisterDeviceOptions {
  /** FCM registration token from the Firebase client SDK */
  token: string;
  /** Device operating system / environment */
  platform: DevicePlatform;
}

export interface DeviceRegistration {
  id: string;
  platform: DevicePlatform;
  isActive: boolean;
  createdAt: string;
}

export interface RemoveDeviceOptions {
  /** FCM token to deactivate */
  token: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsOverviewOptions {
  /** ISO 8601 start date, e.g. '2026-01-01' */
  from?: string;
  /** ISO 8601 end date, e.g. '2026-04-06' */
  to?: string;
}

export interface ChannelStats {
  sent: number;
  delivered: number;
  failed: number;
  cost: number;
}

export interface PushStats {
  sent: number;
  failed: number;
  partial: number;
}

export interface AnalyticsOverview {
  period: { from: string; to: string };
  totals: { sent: number; delivered: number; failed: number; cost: number; currency: Currency };
  channels: {
    sms?: ChannelStats;
    email?: ChannelStats;
    push?: PushStats;
  };
}

export interface DailyDataPoint {
  date: string;
  sms: { sent: number; delivered: number; failed: number; cost: number };
  email: { sent: number; delivered: number; failed: number; cost: number };
  push: { sent: number; failed: number };
}

export interface AnalyticsDailyOptions {
  /** Number of days (1–90). Default: 30 */
  days?: number;
}

export interface AnalyticsDaily {
  days: number;
  data: DailyDataPoint[];
}

// ── HTTP internals ────────────────────────────────────────────────────────────

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface RequestOptions<TBody = unknown> {
  method: HttpMethod;
  path: string;
  body?: TBody;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | undefined>;
}

// ── Errors ────────────────────────────────────────────────────────────────────

/** Thrown when the MsGine API returns a non-2xx response. */
export class MsGineError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'MsGineError';
    Object.setPrototypeOf(this, MsGineError.prototype);
  }
}

/** Thrown when input validation fails before the request is sent. */
export class MsGineValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'MsGineValidationError';
    Object.setPrototypeOf(this, MsGineValidationError.prototype);
  }
}
