import { HttpClient } from '../http-client';
import {
  DeviceRegistration,
  HttpMethod,
  MsGineValidationError,
  PaginationOptions,
  PushHistoryResult,
  PushMessage,
  RegisterDeviceOptions,
  RemoveDeviceOptions,
  SendPushOptions,
} from '../types';

export class PushModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a push notification to devices or an FCM topic.
   *
   * Devices must be registered via {@link registerDevice} first.
   *
   * @example
   * ```ts
   * // Send to specific users
   * await client.push.send({
   *   title: 'New message',
   *   body: 'You have a new message',
   *   userIds: ['user-uuid'],
   * });
   *
   * // Broadcast to a topic
   * await client.push.send({
   *   title: 'Platform update',
   *   body: 'Version 2.0 is live',
   *   topic: 'all-users',
   * });
   * ```
   */
  async send(options: SendPushOptions): Promise<PushMessage> {
    validate(options);

    return this.http.request<PushMessage>({
      method: HttpMethod.POST,
      path: '/developers/push',
      body: {
        title: options.title,
        body: options.body,
        userIds: options.userIds,
        topic: options.topic,
        data: options.data,
        imageUrl: options.imageUrl,
        scheduledFor: options.scheduledFor,
        idempotencyKey: options.idempotencyKey,
      },
    });
  }

  /**
   * Register an FCM device token so it can receive push notifications.
   *
   * Call this after your app obtains a Firebase registration token.
   * Registering the same token again is safe (upsert).
   *
   * @example
   * ```ts
   * // Web
   * import { getToken } from 'firebase/messaging';
   * const token = await getToken(messaging, { vapidKey: VAPID_KEY });
   * await client.push.registerDevice({ token, platform: 'web' });
   * ```
   */
  async registerDevice(options: RegisterDeviceOptions): Promise<DeviceRegistration> {
    if (!options.token) throw new MsGineValidationError('token is required', 'token');
    if (!options.platform) throw new MsGineValidationError('platform is required', 'platform');

    return this.http.request<DeviceRegistration>({
      method: HttpMethod.POST,
      path: '/developers/push/device',
      body: { token: options.token, platform: options.platform },
    });
  }

  /**
   * Deactivate a device token (e.g. on user logout).
   *
   * @example
   * ```ts
   * await client.push.removeDevice({ token: fcmToken });
   * ```
   */
  async removeDevice(options: RemoveDeviceOptions): Promise<void> {
    if (!options.token) throw new MsGineValidationError('token is required', 'token');

    await this.http.request<{ message: string }>({
      method: HttpMethod.DELETE,
      path: '/developers/push/device',
      body: { token: options.token },
    });
  }

  /**
   * Get paginated push notification history.
   */
  async history(options: PaginationOptions = {}): Promise<PushHistoryResult> {
    const raw = await this.http.request<{
      notifications: PushMessage[];
      total: number;
      page: number;
      pages: number;
    }>({
      method: HttpMethod.GET,
      path: '/developers/push/history',
      queryParams: { page: options.page ?? 1, limit: options.limit ?? 20 },
    });

    return { items: raw.notifications, total: raw.total, page: raw.page, pages: raw.pages };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(o: SendPushOptions): void {
  if (!o.title || o.title.trim().length === 0)
    throw new MsGineValidationError('title is required', 'title');
  if (o.title.length > 100)
    throw new MsGineValidationError('title must be 100 characters or fewer', 'title');
  if (!o.body || o.body.trim().length === 0)
    throw new MsGineValidationError('body is required', 'body');
  if (o.body.length > 500)
    throw new MsGineValidationError('body must be 500 characters or fewer', 'body');
  if (o.data) {
    for (const [k, v] of Object.entries(o.data)) {
      if (typeof v !== 'string')
        throw new MsGineValidationError(`data.${k} must be a string (FCM requirement)`, `data.${k}`);
    }
  }
}
