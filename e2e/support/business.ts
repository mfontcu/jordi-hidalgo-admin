import type { MockBackend } from './backend';

type Body = Record<string, unknown>;

const INFO: Body = {
  id: 'biz-1',
  email: 'hola@hidalgojunior.com',
  phone: '+34600111222',
  whatsappPhone: '+34600111222',
  mapsUrl: 'https://maps.example/hj',
  instagramUrl: 'https://instagram.com/hj',
  websiteUrl: 'https://hidalgojunior.com',
  isActive: true,
  translations: [
    {
      id: 't-es',
      businessInfoId: 'biz-1',
      locale: 'es',
      name: 'Hidalgo Junior',
      address: 'Calle Ejemplo 1',
      schedule: 'L–V 9–20',
      about: 'Peluquería',
      cancellationPolicy: '24h',
    },
    {
      id: 't-ca',
      businessInfoId: 'biz-1',
      locale: 'ca',
      name: 'Hidalgo Junior',
      address: 'Carrer Exemple 1',
      schedule: 'Dl–Dv 9–20',
      about: 'Perruqueria',
      cancellationPolicy: '24h',
    },
    {
      id: 't-en',
      businessInfoId: 'biz-1',
      locale: 'en',
      name: 'Hidalgo Junior',
      address: 'Example St 1',
      schedule: 'Mon–Fri 9–20',
      about: 'Barbershop',
      cancellationPolicy: '24h',
    },
  ],
};

const BOOKING: Body = {
  id: 'book-1',
  slotIntervalMinutes: 30,
  minCancellationNoticeMinutes: 120,
  bookingMaxAdvanceDays: 60,
  bookingFirstDate: null,
  bookingLastDate: null,
};

const NOTIFICATIONS: Body[] = [
  {
    id: 'n-1',
    notificationTypeId: 'nt-1',
    notificationTypeCode: 'appointment_reminder',
    notificationTypeName: 'Recordatorio de cita',
    notificationTypeDescription: 'Aviso antes de la cita',
    notificationChannelId: 'nc-1',
    notificationChannelCode: 'push',
    notificationChannelName: 'Push',
    isEnabled: true,
    sendBeforeMinutes: 60,
  },
  {
    id: 'n-2',
    notificationTypeId: 'nt-1',
    notificationTypeCode: 'appointment_reminder',
    notificationTypeName: 'Recordatorio de cita',
    notificationTypeDescription: 'Aviso antes de la cita',
    notificationChannelId: 'nc-2',
    notificationChannelCode: 'email',
    notificationChannelName: 'Email',
    isEnabled: false,
    sendBeforeMinutes: 120,
  },
];

const LEGAL: Body[] = [
  {
    id: 'legal-1',
    code: 'privacy_policy',
    isActive: true,
    publicSurfaces: ['app', 'web'],
    translations: [
      {
        id: 'lt-es',
        legalDocumentId: 'legal-1',
        locale: 'es',
        title: 'Privacidad',
        content: '## Privacidad\n\nTexto **legal**.',
      },
    ],
  },
];

const WEB: Body[] = [
  {
    id: 'web-1',
    code: 'support',
    isActive: true,
    translations: [
      {
        id: 'wt-es',
        webPageId: 'web-1',
        locale: 'es',
        title: 'Soporte',
        content: '## Soporte\n\nEscribe a hola@hidalgojunior.com',
      },
    ],
  },
];

function emptySlide(id: string, sortOrder: number): Body {
  return {
    id,
    sortOrder,
    isActive: false,
    objectKey: '',
    width: 0,
    height: 0,
    contentVersion: '',
    publicSurfaces: ['web', 'app'],
    previewUrl: '',
    translations: [
      { id: `${id}-es`, slideId: id, locale: 'es', altText: '' },
      { id: `${id}-ca`, slideId: id, locale: 'ca', altText: '' },
      { id: `${id}-en`, slideId: id, locale: 'en', altText: '' },
    ],
  };
}

function localeOf(body: Body): string {
  return typeof body.locale === 'string' ? body.locale : '';
}

function wireSlide(backend: MockBackend, slide: Body, slides: Body[]) {
  const id = String(slide.id);
  backend.on('PATCH', `/admin/home-gallery/slides/${id}/status`, (request) => {
    Object.assign(slide, request.postDataJSON() as Body);
    return { status: 204 };
  });
  backend.on('PUT', `/admin/home-gallery/slides/${id}/surfaces`, (request) => {
    Object.assign(slide, request.postDataJSON() as Body);
    return { status: 204 };
  });
  backend.on('PUT', `/admin/home-gallery/slides/${id}/translations`, (request) => {
    const body = request.postDataJSON() as Body;
    const locale = localeOf(body);
    const list = slide.translations as Body[];
    const existing = list.find((row) => row.locale === locale);
    if (existing) Object.assign(existing, body);
    else list.push({ id: `${id}-${locale}`, slideId: id, ...body });
    return { status: 204 };
  });
  backend.on('POST', `/admin/home-gallery/slides/${id}/upload-url`, () => ({
    json: {
      uploadUrl: 'http://localhost:8080/r2/upload',
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      objectKey: `gallery/${id}.jpg`,
      contentType: 'image/jpeg',
      expiresAt: '2099-01-01T00:00:00Z',
    },
  }));
  backend.on('PUT', `/admin/home-gallery/slides/${id}/confirm`, (request) => {
    const body = request.postDataJSON() as Body;
    Object.assign(slide, {
      objectKey: body.objectKey,
      width: 1200,
      height: 800,
      contentVersion: 'v1',
      previewUrl: `https://cdn.example/${id}.jpg`,
    });
    return { json: slide };
  });
  backend.on('DELETE', `/admin/home-gallery/slides/${id}`, () => {
    const index = slides.findIndex((row) => row.id === id);
    if (index >= 0) slides.splice(index, 1);
    return { status: 204 };
  });
}

/** Business content and home gallery, mocked with mutable state for the phase 10 journey. */
export function mockBusiness(backend: MockBackend) {
  const info = { ...INFO, translations: [...(INFO.translations as Body[])] };
  const booking = { ...BOOKING };
  const notifications = NOTIFICATIONS.map((row) => ({ ...row }));
  const legal: Body[] = LEGAL.map((doc) => ({
    ...doc,
    publicSurfaces: [...(doc.publicSurfaces as string[])],
    translations: [...(doc.translations as Body[])],
  }));
  const web: Body[] = WEB.map((page) => ({
    ...page,
    translations: [...(page.translations as Body[])],
  }));
  const slides: Body[] = [emptySlide('slide-1', 0)];

  backend.on('GET', '/admin/business/info', { json: info });
  backend.on('PUT', '/admin/business/info', (request) => {
    Object.assign(info, request.postDataJSON() as Body);
    return { status: 204 };
  });

  backend.on('GET', '/admin/business/booking-settings', { json: booking });
  backend.on('PUT', '/admin/business/booking-settings', (request) => {
    Object.assign(booking, request.postDataJSON() as Body);
    return { status: 204 };
  });

  backend.on('GET', '/admin/business/notifications', { json: notifications });
  for (const setting of notifications) {
    const settingId = String(setting.id);
    backend.on('PATCH', `/admin/business/notifications/${settingId}`, (request) => {
      Object.assign(setting, request.postDataJSON() as Body);
      return { status: 204 };
    });
  }

  backend.on('GET', '/admin/business/legal', { json: legal });
  for (const doc of legal) {
    const code = String(doc.code);
    backend.on('GET', `/admin/business/legal/${code}`, { json: doc });
    backend.on('PATCH', `/admin/business/legal/${code}/status`, (request) => {
      Object.assign(doc, request.postDataJSON() as Body);
      return { status: 204 };
    });
    backend.on('PATCH', `/admin/business/legal/${code}/public-surfaces`, (request) => {
      Object.assign(doc, request.postDataJSON() as Body);
      return { status: 204 };
    });
    backend.on('PUT', `/admin/business/legal/${code}/translations`, (request) => {
      const body = request.postDataJSON() as Body;
      const locale = localeOf(body);
      const list = doc.translations as Body[];
      const existing = list.find((row) => row.locale === locale);
      if (existing) Object.assign(existing, body);
      else list.push({ id: `lt-${locale}`, legalDocumentId: doc.id, ...body });
      return { status: 204 };
    });
  }

  backend.on('GET', '/admin/business/web/pages', { json: web });
  for (const page of web) {
    const code = String(page.code);
    backend.on('GET', `/admin/business/web/pages/${code}`, { json: page });
    backend.on('PATCH', `/admin/business/web/pages/${code}/status`, (request) => {
      Object.assign(page, request.postDataJSON() as Body);
      return { status: 204 };
    });
    backend.on('PUT', `/admin/business/web/pages/${code}/translations`, (request) => {
      const body = request.postDataJSON() as Body;
      const locale = localeOf(body);
      const list = page.translations as Body[];
      const existing = list.find((row) => row.locale === locale);
      if (existing) Object.assign(existing, body);
      else list.push({ id: `wt-${locale}`, webPageId: page.id, ...body });
      return { status: 204 };
    });
  }

  backend.on('GET', '/admin/home-gallery/slides', () => ({ json: { slides } }));
  backend.on('PUT', '/r2/upload', { status: 200, text: '' });
  backend.on('PUT', '/admin/home-gallery/slides/order', (request) => {
    const { slideIds } = request.postDataJSON() as { slideIds: string[] };
    const byId = new Map(slides.map((slide) => [String(slide.id), slide]));
    const ordered: Body[] = [];
    for (const [index, id] of slideIds.entries()) {
      const slide = byId.get(id);
      if (!slide) continue;
      slide.sortOrder = index;
      ordered.push(slide);
    }
    slides.splice(0, slides.length, ...ordered);
    return { status: 204 };
  });
  backend.on('POST', '/admin/home-gallery/slides', () => {
    const created = emptySlide(`slide-${slides.length + 1}`, slides.length);
    slides.push(created);
    wireSlide(backend, created, slides);
    return { status: 201, json: created };
  });

  for (const slide of slides) {
    wireSlide(backend, slide, slides);
  }
}
