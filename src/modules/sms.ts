import { HttpClient, toRecipientString } from '../http-client';
import {
  HttpMethod,
  MsGineValidationError,
  PaginationOptions,
  SendSmsOptions,
  SmsHistoryResult,
  SmsMessage,
} from '../types';

export class SmsModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send an SMS to one or more recipients.
   *
   * @example
   * ```ts
   * const msg = await client.sms.send({
   *   to: ['+256701234567', '+256702345678'],
   *   message: 'Your OTP is 123456',
   * });
   * console.log(msg.id, msg.status);
   * ```
   */
  async send(options: SendSmsOptions): Promise<SmsMessage> {
    validate(options);

    return this.http.request<SmsMessage>({
      method: HttpMethod.POST,
      path: '/developers/sms',
      body: {
        to: toRecipientString(options.to),
        message: options.message,
        from: options.from,
        scheduledFor: options.scheduledFor,
        idempotencyKey: options.idempotencyKey,
      },
    });
  }

  /**
   * Get paginated SMS history.
   *
   * @example
   * ```ts
   * const { items, total } = await client.sms.history({ page: 1, limit: 20 });
   * ```
   */
  async history(options: PaginationOptions = {}): Promise<SmsHistoryResult> {
    const raw = await this.http.request<{
      messages: SmsMessage[];
      total: number;
      page: number;
      pages: number;
    }>({
      method: HttpMethod.GET,
      path: '/developers/sms/history',
      queryParams: { page: options.page ?? 1, limit: options.limit ?? 20 },
    });

    return { items: raw.messages, total: raw.total, page: raw.page, pages: raw.pages };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(o: SendSmsOptions): void {
  const to = Array.isArray(o.to) ? o.to : o.to.split(',');
  if (to.length === 0 || to.some((n) => n.trim().length === 0))
    throw new MsGineValidationError('to: at least one recipient is required', 'to');
  if (!o.message || o.message.trim().length === 0)
    throw new MsGineValidationError('message is required', 'message');
  if (o.message.length > 1000)
    throw new MsGineValidationError('message must be 1 000 characters or fewer', 'message');
  if (o.from && o.from.length > 11)
    throw new MsGineValidationError('from (sender ID) must be 11 characters or fewer', 'from');
}
