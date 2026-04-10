import { HttpClient } from '../http-client';
import {
  AnalyticsDaily,
  AnalyticsDailyOptions,
  AnalyticsOverview,
  AnalyticsOverviewOptions,
  HttpMethod,
  MsGineValidationError,
} from '../types';

export class AnalyticsModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get an aggregated overview of message activity across all channels.
   *
   * Requires READ_MESSAGES or FULL_ACCESS scope on the API key.
   *
   * @example
   * ```ts
   * const overview = await client.analytics.overview({
   *   from: '2026-01-01',
   *   to: '2026-04-06',
   * });
   * console.log(overview.totals.sent, overview.channels.sms?.delivered);
   * ```
   */
  async overview(options: AnalyticsOverviewOptions = {}): Promise<AnalyticsOverview> {
    return this.http.request<AnalyticsOverview>({
      method: HttpMethod.GET,
      path: '/developers/analytics/overview',
      queryParams: { from: options.from, to: options.to },
    });
  }

  /**
   * Get per-day message volume and cost for the last N days.
   *
   * @example
   * ```ts
   * const daily = await client.analytics.daily({ days: 7 });
   * for (const point of daily.data) {
   *   console.log(point.date, point.sms.sent);
   * }
   * ```
   */
  async daily(options: AnalyticsDailyOptions = {}): Promise<AnalyticsDaily> {
    const days = options.days ?? 30;
    if (days < 1 || days > 90)
      throw new MsGineValidationError('days must be between 1 and 90', 'days');

    return this.http.request<AnalyticsDaily>({
      method: HttpMethod.GET,
      path: '/developers/analytics/daily',
      queryParams: { days },
    });
  }
}
