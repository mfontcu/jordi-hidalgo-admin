import { http, HttpResponse } from 'msw';

import { API } from './auth';

export const businessInfoDto = (overrides: Record<string, unknown> = {}) => ({
  id: 'biz-1',
  email: 'hello@hidalgojunior.com',
  phone: '+34600000000',
  whatsappPhone: '',
  mapsUrl: '',
  instagramUrl: '',
  websiteUrl: '',
  isActive: true,
  translations: [
    {
      locale: 'es',
      name: 'Hidalgo Junior',
      address: 'Calle Mayor 1',
      schedule: 'L-V 10-20',
      about: 'Peluquería',
      cancellationPolicy: '24h',
    },
    {
      locale: 'ca',
      name: 'Hidalgo Junior',
      address: 'Carrer Major 1',
      schedule: 'Dl-Dv 10-20',
      about: 'Perruqueria',
      cancellationPolicy: '24h',
    },
    {
      locale: 'en',
      name: 'Hidalgo Junior',
      address: 'Main St 1',
      schedule: 'Mon-Fri 10-20',
      about: 'Barbershop',
      cancellationPolicy: '24h',
    },
  ],
  ...overrides,
});

export const bookingSettingsDto = () => ({
  id: 'booking-1',
  slotIntervalMinutes: 15,
  minCancellationNoticeMinutes: 60,
  bookingMaxAdvanceDays: 30,
  futureAppointmentLimit: 3,
  appointmentChangeLimit: 3,
  availabilityReadLimit: 12,
  bookingFirstDate: null,
  bookingLastDate: null,
});

export const notificationSettingsDto = () => [
  {
    id: 'notif-1',
    notificationTypeId: 't-1',
    notificationTypeCode: 'appointment_confirmed',
    notificationTypeName: 'Cita confirmada',
    notificationTypeDescription: 'Cuando se confirma',
    notificationChannelId: 'c-1',
    notificationChannelCode: 'push',
    notificationChannelName: 'Push',
    isEnabled: true,
    sendBeforeMinutes: null,
    configurable: false,
  },
];

export const legalDocumentsDto = () => [
  {
    id: 'legal-1',
    code: 'privacy_policy',
    isActive: true,
    publicSurfaces: ['app', 'web'],
    translations: [{ locale: 'es', title: 'Privacidad', content: 'Contenido' }],
  },
];

export const webPagesDto = () => [
  {
    id: 'web-1',
    code: 'support',
    isActive: true,
    translations: [{ locale: 'es', title: 'Soporte', content: 'Ayuda' }],
  },
];

export const gallerySlidesDto = () => ({
  slides: [
    {
      id: 'slide-1',
      sortOrder: 0,
      isActive: false,
      objectKey: '',
      width: 0,
      height: 0,
      contentVersion: '',
      publicSurfaces: ['app', 'web'],
      previewUrl: '',
      translations: [
        { locale: 'es', altText: '' },
        { locale: 'ca', altText: '' },
        { locale: 'en', altText: '' },
      ],
    },
  ],
});

/** Live business handlers that record writes for assertions. */
export function liveBusiness() {
  let info = businessInfoDto();
  const calls: { method: string; path: string; body: unknown }[] = [];

  return {
    calls,
    handlers: [
      http.get(`${API}/admin/business/info`, () => HttpResponse.json(info)),
      http.put(`${API}/admin/business/info`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        calls.push({ method: 'PUT', path: 'business/info', body });
        info = {
          ...info,
          ...body,
          translations: Array.isArray(body.translations)
            ? (body.translations as typeof info.translations)
            : info.translations,
        };
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API}/admin/business/booking-settings`, () => HttpResponse.json(bookingSettingsDto())),
      http.get(`${API}/admin/business/notifications`, () => HttpResponse.json(notificationSettingsDto())),
      http.get(`${API}/admin/business/legal`, () => HttpResponse.json(legalDocumentsDto())),
      http.get(`${API}/admin/business/web/pages`, () => HttpResponse.json(webPagesDto())),
      http.get(`${API}/admin/home-gallery/slides`, () => HttpResponse.json(gallerySlidesDto())),
    ],
  };
}
