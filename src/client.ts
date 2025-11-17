import { FetchHttpClient } from './http-client';
import {
  HttpMethod,
  MsGineClientConfig,
  MsGineValidationError,
  SendSmsPayload,
  SendSmsResponse,
  SendSmsSchema,
} from './types';

/**
 * Main MsGine SDK client
 * 
 * @example
 * ```typescript
 * const client = new MsGineClient({
 *   apiToken: process.env.MSGINE_API_TOKEN!
 * });
 * 
 * const result = await client.sendSms({
 *   to: '+256701521269',
 *   message: 'Hello from MsGine!'
 * });
 * ```
 */
export class MsGineClient {
  private readonly httpClient: FetchHttpClient;

  /**
   * Create a new MsGine client
   * 
   * @param config - Client configuration
   * @throws {Error} If API token is not provided
   */
  constructor(config: MsGineClientConfig) {
    this.httpClient = new FetchHttpClient(config);
  }

  /**
   * Send an SMS message
   * 
   * @param payload - SMS message data
   * @returns Promise resolving to the SMS response
   * @throws {MsGineValidationError} If payload validation fails
   * @throws {MsGineError} If the API request fails
   * 
   * @example
   * ```typescript
   * const result = await client.sendSms({
   *   to: '+256701521269',
   *   message: 'Hello World!'
   * });
   * 
   * console.log('Message ID:', result.messageId);
   * console.log('Status:', result.status);
   * ```
   */
  async sendSms(payload: SendSmsPayload): Promise<SendSmsResponse> {
    // Validate payload
    const validation = SendSmsSchema.safeParse(payload);
    
    if (!validation.success) {
      throw new MsGineValidationError(
        'Invalid SMS payload',
        validation.error
      );
    }

    // Send request
    return this.httpClient.request<SendSmsResponse, SendSmsPayload>({
      method: HttpMethod.POST,
      path: '/messages/sms',
      body: validation.data,
    });
  }

  /**
   * Send multiple SMS messages in batch
   * 
   * @param payloads - Array of SMS message data
   * @returns Promise resolving to array of SMS responses
   * @throws {MsGineValidationError} If any payload validation fails
   * @throws {MsGineError} If any API request fails
   * 
   * @example
   * ```typescript
   * const results = await client.sendSmsBatch([
   *   { to: '+256701521269', message: 'Hello!' },
   *   { to: '+256701521270', message: 'Hi there!' }
   * ]);
   * ```
   */
  async sendSmsBatch(
    payloads: SendSmsPayload[]
  ): Promise<SendSmsResponse[]> {
    // Validate all payloads first
    const validations = payloads.map((payload) =>
      SendSmsSchema.safeParse(payload)
    );

    const invalidPayload = validations.find((v) => !v.success);
    if (invalidPayload && !invalidPayload.success) {
      throw new MsGineValidationError(
        'Invalid SMS payload in batch',
        invalidPayload.error
      );
    }

    // Send all messages
    return Promise.all(
      payloads.map((payload) => this.sendSms(payload))
    );
  }
}

/**
 * Create a new MsGine client instance
 * 
 * @param config - Client configuration
 * @returns New MsGine client instance
 * 
 * @example
 * ```typescript
 * const client = createClient({
 *   apiToken: process.env.MSGINE_API_TOKEN!
 * });
 * ```
 */
export function createClient(config: MsGineClientConfig): MsGineClient {
  return new MsGineClient(config);
}