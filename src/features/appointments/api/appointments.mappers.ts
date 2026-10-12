import type { components } from '@/shared/api';

import type { AppointmentItem, AppointmentPage } from '../model/appointment';

type AppointmentDto = components['schemas']['dto.AdminAppointmentResponse'];
type AppointmentListDto = components['schemas']['dto.AdminAppointmentListResponse'];

export function toAppointmentItem(dto: AppointmentDto): AppointmentItem {
  const userId = dto.userId?.trim() ?? '';
  return {
    id: dto.id ?? '',
    userId: userId !== '' ? userId : (dto.user?.id ?? ''),
    customerName: dto.user?.fullName?.trim() ?? '',
    customerAvatarUrl: dto.user?.avatarUrl ?? '',
    serviceName: dto.service?.name ?? '',
    start: dto.appointmentStart ?? '',
    status: (dto.status ?? '').trim().toLowerCase(),
    customerNotes: dto.customerNotes ?? '',
    internalNotes: dto.internalNotes ?? '',
  };
}

export function toAppointmentPage(dto: AppointmentListDto): AppointmentPage {
  return {
    items: (dto.items ?? []).map(toAppointmentItem),
    page: dto.pagination?.page ?? 1,
    pageSize: dto.pagination?.pageSize ?? 0,
    totalItems: dto.pagination?.totalItems ?? 0,
  };
}
