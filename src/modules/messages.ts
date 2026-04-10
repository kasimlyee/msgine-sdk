import { HttpClient } from '../http-client';
import { HttpMethod, MessageRecord, PushMessage } from '../types';

export type AnyMessage = MessageRecord | PushMessage;

export class MessagesModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieve any message (SMS, email, or push) by its ID.
   *
   * Requires READ_MESSAGES or FULL_ACCESS scope.
   *
   * @example
   * ```ts
   * const msg = await client.messages.get('550e8400-e29b-41d4-a716-446655440000');
   * console.log(msg.channel, msg.status);
   * ```
   */
  async get(id: string): Promise<AnyMessage> {
    if (!id || id.trim().length === 0)
      throw new Error('MsGine: message id is required');

    return this.http.request<AnyMessage>({
      method: HttpMethod.GET,
      path: `/developers/${id}`,
    });
  }
}
