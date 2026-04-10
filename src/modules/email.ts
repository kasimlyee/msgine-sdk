import { HttpClient, toRecipientString } from '../http-client';
import {
  EmailHistoryResult,
  EmailMessage,
  HttpMethod,
  MsGineValidationError,
  PaginationOptions,
  SendEmailOptions,
} from '../types';

export class EmailModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send an email.
   *
   * At least one of `text` or `html` is required.
   *
   * @example
   * ```ts
   * const msg = await client.email.send({
   *   from: 'no-reply@mail.msgine.net',
   *   to: 'user@example.com',
   *   subject: 'Welcome to MsGine!',
   *   html: '<h1>Hello!</h1>',
   * });
   * ```
   */
  async send(options: SendEmailOptions): Promise<EmailMessage> {
    validate(options);

    return this.http.request<EmailMessage>({
      method: HttpMethod.POST,
      path: '/developers/email',
      body: {
        from: options.from,
        to: toRecipientString(options.to),
        cc: options.cc ? toRecipientString(options.cc) : undefined,
        bcc: options.bcc ? toRecipientString(options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        scheduledFor: options.scheduledFor,
        idempotencyKey: options.idempotencyKey,
      },
    });
  }

  /**
   * Get paginated email send history.
   *
   * @example
   * ```ts
   * const { items } = await client.email.history({ limit: 50 });
   * ```
   */
  async history(options: PaginationOptions = {}): Promise<EmailHistoryResult> {
    const raw = await this.http.request<{
      messages: EmailMessage[];
      total: number;
      page: number;
      pages: number;
    }>({
      method: HttpMethod.GET,
      path: '/developers/email/history',
      queryParams: { page: options.page ?? 1, limit: options.limit ?? 20 },
    });

    return { items: raw.messages, total: raw.total, page: raw.page, pages: raw.pages };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(o: SendEmailOptions): void {
  if (!o.from || o.from.trim().length === 0)
    throw new MsGineValidationError('from is required', 'from');
  const to = Array.isArray(o.to) ? o.to : o.to.split(',');
  if (to.length === 0 || to.some((e) => e.trim().length === 0))
    throw new MsGineValidationError('to: at least one recipient is required', 'to');
  if (!o.subject || o.subject.trim().length === 0)
    throw new MsGineValidationError('subject is required', 'subject');
  if (o.subject.length > 200)
    throw new MsGineValidationError('subject must be 200 characters or fewer', 'subject');
  if (!o.text && !o.html)
    throw new MsGineValidationError('at least one of text or html is required');
}
