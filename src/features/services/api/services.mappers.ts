import type { components } from '@/shared/api';

import type { Service, ServiceCategory, ServicePage } from '../model/service';

type ServiceDto = components['schemas']['dto.ServiceResponse'];
type ServiceListDto = components['schemas']['dto.AdminServiceListResponse'];
type ServiceCategoryDto = components['schemas']['dto.AdminServiceCategoryResponse'];

export function toService(dto: ServiceDto): Service {
  return {
    id: dto.id ?? '',
    serviceCategoryId: dto.serviceCategoryId ?? '',
    categoryCode: dto.categoryCode ?? '',
    categoryDisplayName: dto.categoryDisplayName ?? '',
    name: dto.name ?? '',
    description: dto.description ?? '',
    durationMinutes: dto.durationMinutes ?? 0,
    priceCents: dto.priceCents ?? 0,
    isActive: dto.isActive ?? false,
    displayOrder: dto.displayOrder ?? 0,
    showOnPublicSite: dto.showOnPublicSite ?? false,
    translations: (dto.translations ?? []).map((translation) => ({
      locale: translation.locale ?? '',
      name: translation.name ?? '',
      description: translation.description ?? '',
    })),
  };
}

export function toServicePage(dto: ServiceListDto): ServicePage {
  return {
    items: (dto.items ?? []).map(toService),
    page: dto.pagination?.page ?? 1,
    pageSize: dto.pagination?.pageSize ?? 0,
    totalItems: dto.pagination?.totalItems ?? 0,
    summary: {
      totalServices: dto.summary?.totalServices ?? 0,
      activeServices: dto.summary?.activeServices ?? 0,
      inactiveServices: dto.summary?.inactiveServices ?? 0,
      totalCategories: dto.summary?.totalCategories ?? 0,
    },
  };
}

export function toServiceCategory(dto: ServiceCategoryDto): ServiceCategory {
  return {
    id: dto.id ?? '',
    code: dto.code ?? '',
    name: dto.name ?? '',
    displayOrder: dto.displayOrder ?? 0,
  };
}
