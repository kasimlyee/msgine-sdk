/**
 * MsGine SDK - Official TypeScript SDK for MsGine Messaging API
 *
 * @packageDocumentation
 */

// Export main client
export { MsGineClient, createClient } from './client';

// Export types
export type {
  MsGineClientConfig,
  RetryConfig,
  SendSmsPayload,
  SendSmsResponse,
  ApiResponse,
  ApiErrorResponse,
  HttpClient,
  RequestOptions,
} from './types';

// Export enums
export { MessageStatus, HttpMethod } from './types';

// Export errors
export { MsGineError, MsGineValidationError } from './types';

// Export schemas for runtime validation
export { SendSmsSchema } from './types';
