/**
 * @msgine/sdk — Official SDK for the MsGine Messaging API
 *
 * Supports: SMS · Email · Push Notifications · Analytics
 *
 * @example
 * ```typescript
 * import { MsGineClient } from '@msgine/sdk';
 *
 * const client = new MsGineClient({ apiKey: process.env.MSGINE_API_KEY! });
 * await client.sms.send({ to: '+256701234567', message: 'Hello from MsGine!' });
 * ```
 */

export { MsGineClient, createClient } from './client';

export type {
  // Config
  MsGineClientConfig,
  RetryConfig,
  // Primitives
  MessageStatus,
  DevicePlatform,
  Currency,
  PaginationOptions,
  PaginatedResult,
  MessageRecord,
  // SMS
  SendSmsOptions,
  SmsMessage,
  SmsHistoryResult,
  // Email
  SendEmailOptions,
  EmailMessage,
  EmailHistoryResult,
  // Push
  SendPushOptions,
  PushMessage,
  PushHistoryResult,
  RegisterDeviceOptions,
  RemoveDeviceOptions,
  DeviceRegistration,
  // Analytics
  AnalyticsOverviewOptions,
  AnalyticsOverview,
  AnalyticsDailyOptions,
  AnalyticsDaily,
  DailyDataPoint,
  ChannelStats,
  PushStats,
} from './types';

export { MsGineError, MsGineValidationError } from './types';
