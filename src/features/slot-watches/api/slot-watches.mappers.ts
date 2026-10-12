import type { components } from '@/shared/api';

import { businessDays, clockOrEmpty, type SlotWatch } from '../model/slot-watch';

type SlotWatchDto = components['schemas']['dto.SlotWatchResponse'];

export function toSlotWatch(dto: SlotWatchDto): SlotWatch {
  return {
    id: dto.id ?? '',
    userId: dto.userId ?? '',
    userDisplayName: dto.userDisplayName ?? '',
    userEmail: dto.userEmail ?? '',
    serviceId: dto.serviceId ?? '',
    serviceName: dto.serviceName ?? '',
    status: dto.status ?? '',
    dates: businessDays(dto.dates),
    timeFrom: clockOrEmpty(dto.timeFrom),
    timeTo: clockOrEmpty(dto.timeTo),
    preferredStart: dto.preferredStart ?? null,
    linkedAppointmentId: dto.linkedAppointmentId ?? '',
    linkedAppointmentStart: dto.linkedAppointmentStart ?? null,
    linkedAppointmentStatus: dto.linkedAppointmentStatus ?? '',
    heldSlotStart: dto.heldSlotStart ?? null,
    holdExpiresAt: dto.holdExpiresAt ?? null,
    notifyCount: dto.notifyCount ?? 0,
    expiresAt: dto.expiresAt ?? '',
    createdAt: dto.createdAt ?? '',
  };
}

export function toSlotWatches(dto: { items?: SlotWatchDto[] }): SlotWatch[] {
  return (dto.items ?? []).map(toSlotWatch);
}
