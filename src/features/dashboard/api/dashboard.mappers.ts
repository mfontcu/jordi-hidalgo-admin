import type { components } from '@/shared/api';

import type { DashboardSummary, NextAppointment } from '../model/dashboard';

type SummaryDto = components['schemas']['dto.AdminDashboardSummaryResponse'];
type NextDto = components['schemas']['dto.AdminDashboardNextAppointmentResponse'];

// The dashboard JSON is snake_case (dto.AdminDashboardSummaryResponse), unlike the rest of the API.

function toNext(dto: NextDto | undefined): NextAppointment | null {
  if (!dto?.id || !dto.start_at) return null;
  const avatar = dto.customer_avatar_url?.trim() ?? '';
  return {
    id: dto.id,
    startAt: dto.start_at,
    serviceName: dto.service_name ?? '',
    customerName: dto.customer_name ?? '',
    customerAvatarUrl: avatar || null,
  };
}

export function toDashboardSummary(dto: SummaryDto): DashboardSummary {
  return {
    appointmentsToday: dto.appointments_today ?? 0,
    pendingAppointments: dto.pending_appointments ?? 0,
    freeSlotsToday: dto.free_slots_today ?? 0,
    clientsThisWeek: dto.clients_this_week ?? 0,
    nextAppointment: toNext(dto.next_appointment),
  };
}
