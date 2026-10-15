import type { components } from '@/shared/api';
import { isBusinessDay } from '@/shared/lib/business-time';

import type { BookingSettings } from '../model/booking-settings';
import type { BusinessInfo, BusinessInfoTranslation } from '../model/business-info';
import type { GallerySlide, GallerySlideTranslation } from '../model/gallery-slide';
import type { LegalDocument, LegalTranslation } from '../model/legal-document';
import { isPublicSurface } from '../model/locales';
import type { NotificationSetting } from '../model/notification-setting';
import type { WebPage, WebPageTranslation } from '../model/web-page';

type Schemas = components['schemas'];
type BusinessInfoDto = Schemas['dto.AdminBusinessInfoResponse'];
type BusinessInfoTranslationDto = Schemas['dto.AdminBusinessInfoTranslationResponse'];
type BookingSettingsDto = Schemas['dto.AdminBookingSettingsResponse'];
type NotificationSettingDto = Schemas['dto.AdminNotificationSettingResponse'];
type LegalDocumentDto = Schemas['dto.AdminLegalDocumentResponse'];
type LegalTranslationDto = Schemas['dto.AdminLegalDocumentTranslationResponse'];
type WebPageDto = Schemas['dto.AdminWebPageResponse'];
type WebPageTranslationDto = Schemas['dto.AdminWebPageTranslationResponse'];
type GallerySlideDto = Schemas['dto.AdminHomeGallerySlideResponse'];
type GallerySlideTranslationDto = Schemas['dto.AdminHomeGallerySlideTranslationDTO'];
type GallerySlidesDto = Schemas['dto.AdminHomeGallerySlidesResponse'];

function toInfoTranslation(dto: BusinessInfoTranslationDto): BusinessInfoTranslation {
  return {
    locale: dto.locale ?? '',
    name: dto.name ?? '',
    address: dto.address ?? '',
    schedule: dto.schedule ?? '',
    about: dto.about ?? '',
    cancellationPolicy: dto.cancellationPolicy ?? '',
  };
}

export function toBusinessInfo(dto: BusinessInfoDto): BusinessInfo {
  return {
    id: dto.id ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    whatsappPhone: dto.whatsappPhone ?? '',
    mapsUrl: dto.mapsUrl ?? '',
    instagramUrl: dto.instagramUrl ?? '',
    websiteUrl: dto.websiteUrl ?? '',
    isActive: dto.isActive ?? false,
    translations: (dto.translations ?? []).map(toInfoTranslation),
  };
}

export function toBookingSettings(dto: BookingSettingsDto): BookingSettings {
  const first = dto.bookingFirstDate ?? '';
  const last = dto.bookingLastDate ?? '';
  return {
    id: dto.id ?? '',
    slotIntervalMinutes: dto.slotIntervalMinutes ?? 0,
    minCancellationNoticeMinutes: dto.minCancellationNoticeMinutes ?? 0,
    bookingMaxAdvanceDays: dto.bookingMaxAdvanceDays ?? 0,
    futureAppointmentLimit: dto.futureAppointmentLimit ?? 0,
    bookingFirstDate: first && isBusinessDay(first) ? first : null,
    bookingLastDate: last && isBusinessDay(last) ? last : null,
  };
}

export function toNotificationSetting(dto: NotificationSettingDto): NotificationSetting {
  return {
    id: dto.id ?? '',
    notificationTypeId: dto.notificationTypeId ?? '',
    notificationTypeCode: dto.notificationTypeCode ?? '',
    notificationTypeName: dto.notificationTypeName ?? '',
    notificationTypeDescription: dto.notificationTypeDescription ?? '',
    notificationChannelId: dto.notificationChannelId ?? '',
    notificationChannelCode: dto.notificationChannelCode ?? '',
    notificationChannelName: dto.notificationChannelName ?? '',
    isEnabled: dto.isEnabled ?? false,
    sendBeforeMinutes: dto.sendBeforeMinutes ?? null,
  };
}

function toLegalTranslation(dto: LegalTranslationDto): LegalTranslation {
  return {
    locale: dto.locale ?? '',
    title: dto.title ?? '',
    content: dto.content ?? '',
  };
}

export function toLegalDocument(dto: LegalDocumentDto): LegalDocument {
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    isActive: dto.isActive ?? false,
    publicSurfaces: (dto.publicSurfaces ?? []).filter(isPublicSurface),
    translations: (dto.translations ?? []).map(toLegalTranslation),
  };
}

function toWebPageTranslation(dto: WebPageTranslationDto): WebPageTranslation {
  return {
    locale: dto.locale ?? '',
    title: dto.title ?? '',
    content: dto.content ?? '',
  };
}

export function toWebPage(dto: WebPageDto): WebPage {
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    isActive: dto.isActive ?? false,
    translations: (dto.translations ?? []).map(toWebPageTranslation),
  };
}

function toGalleryTranslation(dto: GallerySlideTranslationDto): GallerySlideTranslation {
  return {
    locale: dto.locale ?? '',
    altText: dto.altText ?? '',
  };
}

export function toGallerySlide(dto: GallerySlideDto): GallerySlide {
  return {
    id: dto.id ?? '',
    sortOrder: dto.sortOrder ?? 0,
    isActive: dto.isActive ?? false,
    objectKey: dto.objectKey ?? '',
    width: dto.width ?? 0,
    height: dto.height ?? 0,
    contentVersion: dto.contentVersion ?? '',
    publicSurfaces: (dto.publicSurfaces ?? []).filter(isPublicSurface),
    previewUrl: dto.previewUrl ?? '',
    translations: (dto.translations ?? []).map(toGalleryTranslation),
  };
}

export function toGallerySlides(dto: GallerySlidesDto): GallerySlide[] {
  return (dto.slides ?? []).map(toGallerySlide);
}
