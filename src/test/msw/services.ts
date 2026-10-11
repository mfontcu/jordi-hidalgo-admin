import { http, HttpResponse } from 'msw';

import { API } from './auth';

export const CATEGORIES = [
  { id: 'cat-beard', code: 'beard', name: 'Barbería', displayOrder: 2 },
  { id: 'cat-hair', code: 'hair', name: 'Cabello', displayOrder: 1 },
];

export function serviceDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'svc-1',
    serviceCategoryId: 'cat-hair',
    categoryCode: 'hair',
    categoryDisplayName: 'Cabello',
    name: 'Corte de Pelo',
    description: 'Corte clásico',
    durationMinutes: 30,
    priceCents: 1600,
    isActive: true,
    displayOrder: 1,
    showOnPublicSite: true,
    translations: [
      { locale: 'es', name: 'Corte de Pelo', description: 'Corte clásico' },
      { locale: 'ca', name: 'Tall de cabell', description: 'Tall clàssic' },
      { locale: 'en', name: 'Haircut', description: 'Classic haircut' },
    ],
    ...overrides,
  };
}

export const SERVICES = [
  serviceDto(),
  serviceDto({
    id: 'svc-2',
    name: 'Arreglo de barba',
    serviceCategoryId: 'cat-beard',
    categoryCode: 'beard',
    categoryDisplayName: 'Barbería',
    durationMinutes: 15,
    priceCents: 1000,
    displayOrder: 2,
    isActive: false,
  }),
];

export function listResponse(items = SERVICES, { page = 1, totalItems = items.length } = {}) {
  return {
    items,
    pagination: { page, pageSize: 10, totalItems, totalPages: Math.ceil(totalItems / 10) },
    summary: {
      totalServices: 12,
      activeServices: 9,
      inactiveServices: 3,
      totalCategories: CATEGORIES.length,
    },
  };
}

/** `GET /admin/services`, recording each request's query. */
export function servicesList(
  reply: (query: URLSearchParams) => ReturnType<typeof listResponse> = () => listResponse(),
) {
  const queries: URLSearchParams[] = [];
  const handler = http.get(`${API}/admin/services`, ({ request }) => {
    const query = new URL(request.url).searchParams;
    queries.push(query);
    return HttpResponse.json(reply(query));
  });
  return { handler, queries };
}

export const categoriesHandler = http.get(`${API}/admin/services/categories`, () =>
  HttpResponse.json({ items: CATEGORIES }),
);

export function serviceDetail(service = serviceDto()) {
  return http.get(`${API}/admin/services/${service.id}`, () => HttpResponse.json(service));
}
