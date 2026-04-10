import { HttpClient } from './http-client';
import { MsGineClientConfig } from './types';
import { SmsModule } from './modules/sms';
import { EmailModule } from './modules/email';
import { PushModule } from './modules/push';
import { AnalyticsModule } from './modules/analytics';
import { MessagesModule } from './modules/messages';

/**
 * MsGine API client.
 *
 * Instantiate once and reuse across your application.
 *
 * @example
 * ```typescript
 * import { MsGineClient } from '@msgine/sdk';
 *
 * const client = new MsGineClient({ apiKey: process.env.MSGINE_API_KEY! });
 *
 * // SMS
 * await client.sms.send({ to: '+256701234567', message: 'Hello!' });
 *
 * // Email
 * await client.email.send({
 *   from: 'no-reply@mail.msgine.net',
 *   to: 'user@example.com',
 *   subject: 'Welcome',
 *   html: '<h1>Hello</h1>',
 * });
 *
 * // Push
 * await client.push.registerDevice({ token: fcmToken, platform: 'web' });
 * await client.push.send({ title: 'Hey!', body: 'New message arrived.' });
 *
 * // Analytics
 * const stats = await client.analytics.overview({ from: '2026-01-01' });
 * ```
 */
export class MsGineClient {
  /** Send SMS messages and retrieve history */
  readonly sms: SmsModule;
  /** Send emails and retrieve history */
  readonly email: EmailModule;
  /** Send push notifications, manage device tokens, retrieve history */
  readonly push: PushModule;
  /** Channel analytics — overview and per-day breakdown */
  readonly analytics: AnalyticsModule;
  /** Look up any message by ID across all channels */
  readonly messages: MessagesModule;

  constructor(config: MsGineClientConfig) {
    const http = new HttpClient(config);
    this.sms = new SmsModule(http);
    this.email = new EmailModule(http);
    this.push = new PushModule(http);
    this.analytics = new AnalyticsModule(http);
    this.messages = new MessagesModule(http);
  }
}

/** Convenience factory — equivalent to `new MsGineClient(config)`. */
export function createClient(config: MsGineClientConfig): MsGineClient {
  return new MsGineClient(config);
}
