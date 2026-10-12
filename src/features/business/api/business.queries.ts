import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { businessKeys } from './business.keys';
import {
  toBookingSettings,
  toBusinessInfo,
  toGallerySlides,
  toLegalDocument,
  toNotificationSetting,
  toWebPage,
} from './business.mappers';

/**
 * Long enough for the screen to take over what its route loader fetched without asking again;
 * a later visit refetches, as the Flutter screen reloads on entry. Writes invalidate at once.
 */
const STALE_TIME = 10_000;

/** `GET /admin/business/info`. Contact fields are not localized by Accept-Language. */
export function businessInfoQueryOptions() {
  return queryOptions({
    queryKey: businessKeys.info(),
    queryFn: async ({ signal }) =>
      toBusinessInfo(unwrap(await apiClient.GET('/admin/business/info', { signal }))),
    staleTime: STALE_TIME,
  });
}

/** `GET /admin/business/booking-settings`. */
export function bookingSettingsQueryOptions() {
  return queryOptions({
    queryKey: businessKeys.bookingSettings(),
    queryFn: async ({ signal }) =>
      toBookingSettings(unwrap(await apiClient.GET('/admin/business/booking-settings', { signal }))),
    staleTime: STALE_TIME,
  });
}

/** `GET /admin/business/notifications`. Type and channel names follow Accept-Language. */
export function notificationsQueryOptions() {
  return queryOptions({
    queryKey: businessKeys.notifications(),
    queryFn: async ({ signal }) =>
      unwrap(await apiClient.GET('/admin/business/notifications', { signal })).map(toNotificationSetting),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** `GET /admin/business/legal`. Document titles in the list are localized. */
export function legalDocumentsQueryOptions() {
  return queryOptions({
    queryKey: businessKeys.legal(),
    queryFn: async ({ signal }) =>
      unwrap(await apiClient.GET('/admin/business/legal', { signal })).map(toLegalDocument),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** `GET /admin/business/web/pages`. Page titles are localized. */
export function webPagesQueryOptions() {
  return queryOptions({
    queryKey: businessKeys.webPages(),
    queryFn: async ({ signal }) =>
      unwrap(await apiClient.GET('/admin/business/web/pages', { signal })).map(toWebPage),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** `GET /admin/home-gallery/slides`. */
export function gallerySlidesQueryOptions() {
  return queryOptions({
    queryKey: businessKeys.gallery(),
    queryFn: async ({ signal }) =>
      toGallerySlides(unwrap(await apiClient.GET('/admin/home-gallery/slides', { signal }))),
    staleTime: STALE_TIME,
  });
}
