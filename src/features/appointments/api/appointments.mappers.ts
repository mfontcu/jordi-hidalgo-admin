import type { components } from '@/shared/api';
import { addMinutesToInstant } from '@/shared/lib/business-time';

import type {
  AppointmentDetail,
  AppointmentItem,
  AppointmentPage,
  AppointmentSummary,
  CustomerPushMessage,
  RescheduleChainEntry,
  SlotConflict,
  TimeSlot,
} from '../model/appointment';

type AppointmentDto = components['schemas']['dto.AdminAppointmentResponse'];
type AppointmentListDto = components['schemas']['dto.AdminAppointmentListResponse'];
type SummaryDto = components['schemas']['dto.AdminAppointmentSummaryResponse'];
type PushDto = components['schemas']['dto.AdminCustomerPushResponse'];
type ChainEntryDto = components['schemas']['dto.AdminAppointmentRescheduleChainEntryResponse'];
type SlotDto = components['schemas']['dto.TimeSlotResponse'];
type DateDto = components['schemas']['dto.AvailableDateResponse'];
type SlotConflictDto = components['schemas']['dto.AdminSlotConflictResponse'];

export function toAppointmentItem(dto: AppointmentDto): AppointmentItem {
  const userId = dto.userId?.trim() ?? '';
  const start = dto.appointmentStart ?? '';
  const end = dto.appointmentEnd?.trim() ?? '';
  return {
    id: dto.id ?? '',
    userId: userId !== '' ? userId : (dto.user?.id ?? ''),
    customerName: dto.user?.fullName?.trim() ?? '',
    customerAvatarUrl: dto.user?.avatarUrl ?? '',
    serviceId: dto.service?.id ?? '',
    serviceName: dto.service?.name ?? '',
    customerPhone: dto.user?.phone ?? '',
    customerEmail: dto.user?.email ?? '',
    start,
    end: end !== '' ? end : addMinutesToInstant(start, dto.service?.durationMinutes ?? 0),
    status: (dto.status ?? '').trim().toLowerCase(),
    customerNotes: dto.customerNotes ?? '',
    internalNotes: dto.internalNotes ?? '',
  };
}

function toSummary(dto: SummaryDto | undefined): AppointmentSummary {
  return {
    totalToday: dto?.totalToday ?? 0,
    pending: dto?.pendingAppointments ?? 0,
    completed: dto?.completedAppointments ?? 0,
    cancelled: dto?.cancelledAppointments ?? 0,
    noShow: dto?.noShowAppointments ?? 0,
    rescheduled: dto?.rescheduledAppointments ?? 0,
    freeSlots: dto?.freeSlots ?? 0,
  };
}

export function toAppointmentPage(dto: AppointmentListDto): AppointmentPage {
  return {
    items: (dto.items ?? []).map(toAppointmentItem),
    page: dto.pagination?.page ?? 1,
    pageSize: dto.pagination?.pageSize ?? 0,
    totalItems: dto.pagination?.totalItems ?? 0,
    summary: toSummary(dto.summary),
  };
}

export function toAppointmentDetail(dto: AppointmentDto): AppointmentDetail {
  const item = toAppointmentItem(dto);
  const service = dto.service;
  const user = dto.user;
  return {
    ...item,
    cancellationReason: dto.cancellationReason ?? '',
    cancelledBy: dto.cancelledBy ?? '',
    channel: dto.channel ?? '',
    replacesAppointmentId: dto.replacesAppointmentId ?? '',
    rootAppointmentId: dto.rootAppointmentId ?? '',
    rescheduleChainLength: dto.rescheduleChainLength ?? 0,
    service: {
      id: service?.id ?? '',
      name: service?.name ?? '',
      description: service?.description ?? '',
      durationMinutes: service?.durationMinutes ?? 0,
      priceCents: service?.priceCents ?? 0,
    },
    user: user
      ? {
          id: user.id ?? item.userId,
          fullName: user.fullName?.trim() ?? '',
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phone: user.phone ?? '',
          email: user.email ?? '',
          avatarUrl: user.avatarUrl ?? '',
        }
      : null,
  };
}

export function toCustomerPushMessage(dto: PushDto): CustomerPushMessage {
  return {
    id: dto.id ?? '',
    appointmentId: dto.appointmentId ?? '',
    recipientUserId: dto.recipientUserId ?? '',
    title: dto.title ?? '',
    body: dto.body ?? '',
    deliveryStatus: (dto.deliveryStatus ?? '').trim().toLowerCase(),
    fcmSuccessCount: dto.fcmSuccessCount ?? 0,
    fcmFailureCount: dto.fcmFailureCount ?? 0,
    readAt: dto.readAt ?? '',
    createdAt: dto.createdAt ?? '',
  };
}

export function toRescheduleChainEntry(dto: ChainEntryDto): RescheduleChainEntry {
  return {
    id: dto.id ?? '',
    start: dto.appointmentStart ?? '',
    end: dto.appointmentEnd ?? '',
    status: (dto.status ?? '').trim().toLowerCase(),
    rescheduledBy: dto.rescheduledBy ?? '',
    createdAt: dto.createdAt ?? '',
  };
}

export function toTimeSlot(dto: SlotDto): TimeSlot {
  return { time: dto.time ?? '', isAvailable: dto.isAvailable ?? false };
}

export function toAvailableDate(dto: DateDto): string {
  return dto.date ?? '';
}

/** The `conflict` of a 409 status change; null when the body does not carry one. */
export function toSlotConflict(body: unknown): SlotConflict | null {
  if (!body || typeof body !== 'object') return null;
  const conflict = (body as SlotConflictDto).conflict;
  const start = conflict?.start ?? '';
  const end = conflict?.end ?? '';
  if (!conflict || start === '' || end === '') return null;
  if (conflict.kind === 'hold') {
    return { kind: 'hold', start, end, holdExpiresAt: conflict.holdExpiresAt ?? '' };
  }
  if (conflict.kind === 'appointment') {
    return {
      kind: 'appointment',
      start,
      end,
      customerName: conflict.customerName?.trim() ?? '',
      serviceName: conflict.serviceName?.trim() ?? '',
    };
  }
  return null;
}
