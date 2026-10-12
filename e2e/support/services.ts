import type { MockBackend } from './backend';

type Locale = 'es' | 'ca' | 'en';

const NAMES: Record<string, Record<Locale, string>> = {
  'svc-1': { es: 'Corte de Pelo', ca: 'Tall de cabell', en: 'Haircut' },
  'svc-2': { es: 'Arreglo de barba', ca: 'Arranjament de barba', en: 'Beard trim' },
};

const CATEGORY_NAMES: Record<string, Record<Locale, string>> = {
  hair: { es: 'Cabello', ca: 'Cabell', en: 'Hair' },
  beard: { es: 'Barbería', ca: 'Barberia', en: 'Barbershop' },
};

type StoredService = {
  id: string;
  categoryCode: 'hair' | 'beard';
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
  displayOrder: number;
  showOnPublicSite: boolean;
};

const localeOf = (header: string | undefined): Locale =>
  header?.startsWith('ca') ? 'ca' : header?.startsWith('en') ? 'en' : 'es';

/**
 * The services of the backend, mocked with state: writes change what later reads return, and
 * names follow `Accept-Language`, as the backend localizes them.
 */
export function mockServices(backend: MockBackend) {
  const services: StoredService[] = [
    {
      id: 'svc-1',
      categoryCode: 'hair',
      durationMinutes: 30,
      priceCents: 1600,
      isActive: true,
      displayOrder: 1,
      showOnPublicSite: true,
    },
    {
      id: 'svc-2',
      categoryCode: 'beard',
      durationMinutes: 15,
      priceCents: 1000,
      isActive: true,
      displayOrder: 2,
      showOnPublicSite: false,
    },
  ];

  const dto = (service: StoredService, locale: Locale) => {
    const names = NAMES[service.id] ?? { es: 'Nuevo', ca: 'Nou', en: 'New' };
    return {
      ...service,
      serviceCategoryId: `cat-${service.categoryCode}`,
      categoryDisplayName: CATEGORY_NAMES[service.categoryCode]?.[locale],
      name: names[locale],
      description: '',
      translations: (['es', 'ca', 'en'] as const).map((item) => ({
        locale: item,
        name: names[item],
        description: '',
      })),
    };
  };
  const find = (id: string) => services.find((service) => service.id === id);

  // Public catalog used by the availability overview (same DTOs as admin, without pagination).
  backend.on('GET', '/services', (request) => {
    const locale = localeOf(request.headers()['accept-language']);
    return {
      json: services
        .filter((service) => service.isActive && service.showOnPublicSite)
        .map((service) => dto(service, locale))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    };
  });

  backend.on('GET', '/admin/services', (request) => {
    const locale = localeOf(request.headers()['accept-language']);
    const query = new URL(request.url()).searchParams;
    const status = query.get('status');
    const category = query.get('categoryCode');
    const search = (query.get('search') ?? '').toLowerCase();
    const items = services
      .filter((service) => status !== 'active' || service.isActive)
      .filter((service) => status !== 'inactive' || !service.isActive)
      .filter((service) => !category || service.categoryCode === category)
      .map((service) => dto(service, locale))
      .filter((service) => !search || service.name.toLowerCase().includes(search))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return {
      json: {
        items,
        pagination: { page: 1, pageSize: 10, totalItems: items.length, totalPages: 1 },
        summary: {
          totalServices: services.length,
          activeServices: services.filter((service) => service.isActive).length,
          inactiveServices: services.filter((service) => !service.isActive).length,
          totalCategories: 2,
        },
      },
    };
  });

  backend.on('GET', '/admin/services/categories', (request) => {
    const locale = localeOf(request.headers()['accept-language']);
    return {
      json: {
        items: (['hair', 'beard'] as const).map((code, index) => ({
          id: `cat-${code}`,
          code,
          name: CATEGORY_NAMES[code]?.[locale],
          displayOrder: index + 1,
        })),
      },
    };
  });

  backend.on('POST', '/admin/services', (request) => {
    const body = request.postDataJSON() as { serviceCategoryId: string } & Omit<
      StoredService,
      'id' | 'categoryCode'
    >;
    const created: StoredService = {
      id: 'svc-3',
      categoryCode: body.serviceCategoryId === 'cat-beard' ? 'beard' : 'hair',
      durationMinutes: body.durationMinutes,
      priceCents: body.priceCents,
      isActive: body.isActive,
      displayOrder: body.displayOrder,
      showOnPublicSite: body.showOnPublicSite,
    };
    services.push(created);
    mockService(created.id);
    return { status: 201, json: dto(created, 'es') };
  });

  const mockService = (id: string) => {
    backend.on('GET', `/admin/services/${id}`, (request) => {
      const service = find(id);
      return service
        ? { json: dto(service, localeOf(request.headers()['accept-language'])) }
        : { status: 404, text: 'service not found' };
    });
    for (const [action, isActive] of [
      ['activate', true],
      ['deactivate', false],
    ] as const) {
      backend.on('PATCH', `/admin/services/${id}/${action}`, () => {
        const service = find(id);
        if (service) service.isActive = isActive;
        return { status: 204, text: '' };
      });
    }
    backend.on('PATCH', `/admin/services/${id}/display-order`, (request) => {
      const service = find(id);
      if (!service) return { status: 404, text: 'service not found' };
      service.displayOrder = (request.postDataJSON() as { displayOrder: number }).displayOrder;
      return { json: dto(service, 'es') };
    });
    backend.on('PATCH', `/admin/services/${id}/show-on-public-site`, (request) => {
      const service = find(id);
      if (!service) return { status: 404, text: 'service not found' };
      service.showOnPublicSite = (request.postDataJSON() as { showOnPublicSite: boolean }).showOnPublicSite;
      return { json: dto(service, 'es') };
    });
    backend.on('DELETE', `/admin/services/${id}`, () => {
      const index = services.findIndex((service) => service.id === id);
      if (index >= 0) services.splice(index, 1);
      return { status: 204, text: '' };
    });
  };
  for (const service of services) mockService(service.id);

  return services;
}
