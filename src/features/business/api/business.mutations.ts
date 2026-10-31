import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { BookingSettings, BookingSettingsUpdate } from '../model/booking-settings';
import type { BusinessInfo, BusinessInfoUpdate } from '../model/business-info';
import type { GalleryAltTextsInput, GalleryContentType, GallerySlide } from '../model/gallery-slide';
import type { LegalDocument, LegalTranslationInput } from '../model/legal-document';
import type { PublicSurface } from '../model/locales';
import type { NotificationSetting, NotificationSettingUpdate } from '../model/notification-setting';
import type { WebPage, WebPageTranslationInput } from '../model/web-page';
import { businessKeys } from './business.keys';
import { toGallerySlide } from './business.mappers';
import { uploadGallerySlideImage } from './gallery-upload';

async function invalidateInfo(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: businessKeys.info() });
}

async function invalidateBooking(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: businessKeys.bookingSettings() });
}

async function invalidateNotifications(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: businessKeys.notifications() });
}

async function invalidateLegal(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: businessKeys.legal() });
}

async function invalidateWeb(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: businessKeys.webPages() });
}

async function invalidateGallery(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: businessKeys.gallery() });
}

function storeGallery(queryClient: QueryClient, slides: GallerySlide[]) {
  queryClient.setQueryData(businessKeys.gallery(), slides);
  return slides;
}

function replaceGallerySlide(queryClient: QueryClient, slide: GallerySlide) {
  queryClient.setQueryData<GallerySlide[]>(businessKeys.gallery(), (current) =>
    (current ?? []).map((item) => (item.id === slide.id ? slide : item)),
  );
  return slide;
}

/** `PUT /admin/business/info` (204). Reloads the stored info. */
export async function updateBusinessInfo(
  queryClient: QueryClient,
  info: BusinessInfo,
  update: BusinessInfoUpdate,
) {
  unwrap(
    await apiClient.PUT('/admin/business/info', {
      body: {
        id: info.id,
        email: update.email,
        phone: update.phone,
        whatsappPhone: update.whatsappPhone,
        mapsUrl: update.mapsUrl,
        instagramUrl: update.instagramUrl,
        websiteUrl: update.websiteUrl,
        isActive: update.isActive,
        translations: update.translations,
      },
    }),
  );
  await invalidateInfo(queryClient);
}

/**
 * `PUT /admin/business/booking-settings` (204). Date fields are always sent (including null) so
 * clearing a date matches Flutter's JSON body.
 */
export async function updateBookingSettings(
  queryClient: QueryClient,
  settings: BookingSettings,
  update: BookingSettingsUpdate,
  dates: { bookingFirstDate: string | null; bookingLastDate: string | null },
) {
  unwrap(
    await apiClient.PUT('/admin/business/booking-settings', {
      // OpenAPI types omit null; the backend expects explicit null to clear a date (Flutter).
      body: {
        id: settings.id,
        slotIntervalMinutes: update.slotIntervalMinutes,
        minCancellationNoticeMinutes: update.minCancellationNoticeMinutes,
        bookingMaxAdvanceDays: update.bookingMaxAdvanceDays,
        futureAppointmentLimit: update.futureAppointmentLimit,
        appointmentChangeLimit: update.appointmentChangeLimit,
        availabilityReadLimit: update.availabilityReadLimit,
        bookingFirstDate: dates.bookingFirstDate,
        bookingLastDate: dates.bookingLastDate,
      } as never,
    }),
  );
  await invalidateBooking(queryClient);
}

/** `PATCH /admin/business/notifications/{settingID}` (204). */
export async function updateNotificationSetting(
  queryClient: QueryClient,
  id: string,
  update: NotificationSettingUpdate,
) {
  unwrap(
    await apiClient.PATCH('/admin/business/notifications/{settingID}', {
      params: { path: { settingID: id } },
      body: {
        isEnabled: update.isEnabled,
        ...(update.sendBeforeMinutes === undefined ? {} : { sendBeforeMinutes: update.sendBeforeMinutes }),
        ...(update.sendAtLocalTime === undefined ? {} : { sendAtLocalTime: update.sendAtLocalTime }),
      },
    }),
  );
  await invalidateNotifications(queryClient);
}

/** Optimistic patch of one row in the notifications list. */
export function patchNotificationInCache(
  queryClient: QueryClient,
  id: string,
  patch: Partial<Pick<NotificationSetting, 'isEnabled' | 'sendBeforeMinutes' | 'sendAtLocalTime'>>,
) {
  queryClient.setQueryData<NotificationSetting[]>(businessKeys.notifications(), (current) =>
    (current ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
  );
}

export function restoreNotifications(queryClient: QueryClient, previous: NotificationSetting[] | undefined) {
  if (previous !== undefined) queryClient.setQueryData(businessKeys.notifications(), previous);
}

/** `PATCH /admin/business/legal/{code}/status` (204). */
export async function updateLegalStatus(queryClient: QueryClient, code: string, isActive: boolean) {
  unwrap(
    await apiClient.PATCH('/admin/business/legal/{code}/status', {
      params: { path: { code } },
      body: { isActive },
    }),
  );
  await invalidateLegal(queryClient);
}

/** `PATCH /admin/business/legal/{code}/public-surfaces` (204). */
export async function updateLegalSurfaces(
  queryClient: QueryClient,
  code: string,
  publicSurfaces: PublicSurface[],
) {
  unwrap(
    await apiClient.PATCH('/admin/business/legal/{code}/public-surfaces', {
      params: { path: { code } },
      body: { publicSurfaces },
    }),
  );
  await invalidateLegal(queryClient);
}

/** `PUT /admin/business/legal/{code}/translations` (204). */
export async function updateLegalTranslation(
  queryClient: QueryClient,
  code: string,
  translation: LegalTranslationInput,
) {
  unwrap(
    await apiClient.PUT('/admin/business/legal/{code}/translations', {
      params: { path: { code } },
      body: translation,
    }),
  );
  await invalidateLegal(queryClient);
}

/** Patch one legal document in the list cache (status / surfaces / one translation). */
export function patchLegalInCache(
  queryClient: QueryClient,
  code: string,
  patch: (doc: LegalDocument) => LegalDocument,
) {
  queryClient.setQueryData<LegalDocument[]>(businessKeys.legal(), (current) =>
    (current ?? []).map((doc) => (doc.code === code ? patch(doc) : doc)),
  );
}

/** `PATCH /admin/business/web/pages/{code}/status` (204). */
export async function updateWebPageStatus(queryClient: QueryClient, code: string, isActive: boolean) {
  unwrap(
    await apiClient.PATCH('/admin/business/web/pages/{code}/status', {
      params: { path: { code } },
      body: { isActive },
    }),
  );
  await invalidateWeb(queryClient);
}

/** `PUT /admin/business/web/pages/{code}/translations` (204). */
export async function updateWebPageTranslation(
  queryClient: QueryClient,
  code: string,
  translation: WebPageTranslationInput,
) {
  unwrap(
    await apiClient.PUT('/admin/business/web/pages/{code}/translations', {
      params: { path: { code } },
      body: translation,
    }),
  );
  await invalidateWeb(queryClient);
}

export function patchWebPageInCache(
  queryClient: QueryClient,
  code: string,
  patch: (page: WebPage) => WebPage,
) {
  queryClient.setQueryData<WebPage[]>(businessKeys.webPages(), (current) =>
    (current ?? []).map((page) => (page.code === code ? patch(page) : page)),
  );
}

/** `POST /admin/home-gallery/slides`. */
export async function createGallerySlide(queryClient: QueryClient) {
  const slide = toGallerySlide(unwrap(await apiClient.POST('/admin/home-gallery/slides', {})));
  queryClient.setQueryData<GallerySlide[]>(businessKeys.gallery(), (current) => [...(current ?? []), slide]);
  await invalidateGallery(queryClient);
  return slide;
}

/** `PATCH /admin/home-gallery/slides/{id}/status` (204). */
export async function updateGallerySlideStatus(queryClient: QueryClient, id: string, isActive: boolean) {
  unwrap(
    await apiClient.PATCH('/admin/home-gallery/slides/{id}/status', {
      params: { path: { id } },
      body: { isActive },
    }),
  );
  await invalidateGallery(queryClient);
}

/** `PUT /admin/home-gallery/slides/{id}/surfaces` (204). */
export async function updateGallerySlideSurfaces(
  queryClient: QueryClient,
  id: string,
  publicSurfaces: PublicSurface[],
) {
  unwrap(
    await apiClient.PUT('/admin/home-gallery/slides/{id}/surfaces', {
      params: { path: { id } },
      body: { publicSurfaces },
    }),
  );
  await invalidateGallery(queryClient);
}

/** Upserts alt text for every locale in `alts` (`PUT …/translations`). */
export async function updateGallerySlideAlts(
  queryClient: QueryClient,
  id: string,
  alts: GalleryAltTextsInput,
) {
  for (const [locale, altText] of Object.entries(alts)) {
    unwrap(
      await apiClient.PUT('/admin/home-gallery/slides/{id}/translations', {
        params: { path: { id } },
        body: { locale, altText: altText.trim() },
      }),
    );
  }
  await invalidateGallery(queryClient);
}

/** `PUT /admin/home-gallery/slides/order`. */
export async function reorderGallerySlides(queryClient: QueryClient, slideIds: string[]) {
  unwrap(await apiClient.PUT('/admin/home-gallery/slides/order', { body: { slideIds } }));
  await invalidateGallery(queryClient);
}

/** Presign → PUT bytes → confirm; refreshes the gallery list. */
export async function uploadGalleryImage(
  queryClient: QueryClient,
  slideId: string,
  file: File,
  contentType: GalleryContentType,
) {
  const slide = await uploadGallerySlideImage(slideId, file, contentType);
  replaceGallerySlide(queryClient, slide);
  await invalidateGallery(queryClient);
  return slide;
}

/** `DELETE /admin/home-gallery/slides/{id}`. */
export async function deleteGallerySlide(queryClient: QueryClient, id: string) {
  unwrap(await apiClient.DELETE('/admin/home-gallery/slides/{id}', { params: { path: { id } } }));
  queryClient.setQueryData<GallerySlide[]>(businessKeys.gallery(), (current) =>
    (current ?? []).filter((slide) => slide.id !== id),
  );
  await invalidateGallery(queryClient);
}

/** Replace the gallery list (optimistic reorder before the order write settles). */
export function setGallerySlides(queryClient: QueryClient, slides: GallerySlide[]) {
  return storeGallery(queryClient, slides);
}
