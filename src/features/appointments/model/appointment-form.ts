import { z } from 'zod';

import { instantAt, isBusinessDay, isClockTime } from '@/shared/lib/business-time';

import type { TimeSlot } from './appointment';

// Create form (AppointmentFormScreen): client optional, service and start required, status toggle,
// internal notes only. Prefill comes from the URL (appointmentFormSearchSchema).

export const appointmentFormSchema = z.object({
  userId: z.string(),
  serviceId: z.string().min(1, 'appointmentFormServiceRequired'),
  day: z.string().min(1, 'appointmentFormSelectServiceFirst'),
  time: z.string().min(1, 'appointmentFormSelectServiceFirst'),
  confirmed: z.boolean(),
  internalNotes: z.string(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
export type AppointmentFormErrorKey =
  | 'appointmentFormServiceRequired'
  | 'appointmentFormSelectServiceFirst'
  | 'appointmentFormSelectValidService'
  | 'appointmentFormNoSlotsDay';

/** The URL fields the form reads (clientId, prefillServiceId, prefillDate, prefillTime). */
export type AppointmentFormPrefill = {
  clientId?: string;
  prefillServiceId?: string;
  prefillDate?: string;
  prefillTime?: string;
};

/** One row of the client lookup: the name, and phone and email when the account has them. */
export type UserLookupOption = { id: string; title: string; subtitle?: string };

/**
 * Label of a client or staff account in the appointment form lookup. Accounts can share a name
 * or a phone, so the line under the name keeps both the phone and the email.
 */
export function userLookupOption(user: {
  id?: string;
  adminAlias?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}): UserLookupOption {
  const alias = user.adminAlias?.trim() ?? '';
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const id = user.id ?? '';
  const contact = [user.phone, user.email]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part !== '')
    .join(' · ');
  return {
    id,
    title: alias !== '' ? alias : name !== '' ? name : id,
    ...(contact !== '' ? { subtitle: contact } : {}),
  };
}

/** Defaults from the form's URL prefill. */
export function appointmentFormDefaults(search: AppointmentFormPrefill): AppointmentFormValues {
  return {
    userId: search.clientId ?? '',
    serviceId: search.prefillServiceId ?? '',
    day: search.prefillDate && isBusinessDay(search.prefillDate) ? search.prefillDate : '',
    time: search.prefillTime ?? '',
    confirmed: true,
    internalNotes: '',
  };
}

/** What `POST /admin/appointments` receives once the form is valid. */
export type CreateAppointmentInput = {
  userId: string;
  serviceId: string;
  appointmentStart: string;
  status: 'confirmed' | 'pending';
  customerNotes: string;
  internalNotes: string;
};

/**
 * Builds the create body from the form. The selected slot must be available; Flutter refuses a
 * occupied one the same way.
 */
export function createInputOf(
  values: AppointmentFormValues,
  slots: readonly TimeSlot[],
): { ok: true; input: CreateAppointmentInput } | { ok: false; error: AppointmentFormErrorKey } {
  const serviceId = values.serviceId.trim();
  if (!serviceId) return { ok: false, error: 'appointmentFormServiceRequired' };
  if (!isBusinessDay(values.day) || !values.time.trim()) {
    return { ok: false, error: 'appointmentFormSelectServiceFirst' };
  }
  const slot = slots.find((item) => item.time === values.time);
  if (!slot) return { ok: false, error: 'appointmentFormSelectValidService' };
  if (!slot.isAvailable) return { ok: false, error: 'appointmentFormNoSlotsDay' };
  const day = values.day;
  const time = values.time;
  if (!isBusinessDay(day) || !isClockTime(time)) {
    return { ok: false, error: 'appointmentFormSelectServiceFirst' };
  }
  return {
    ok: true,
    input: {
      userId: values.userId.trim(),
      serviceId,
      appointmentStart: instantAt(day, time),
      status: values.confirmed ? 'confirmed' : 'pending',
      customerNotes: '',
      internalNotes: values.internalNotes.trim(),
    },
  };
}

/**
 * Picks the first available day on or after `preferred`, else the first available day, else empty
 * (AdminTimeSlotPicker._calendarInitialDate).
 */
export function pickAvailableDay(dates: readonly string[], preferred: string): string {
  if (dates.length === 0) return '';
  const sorted = [...dates].sort();
  if (preferred && isBusinessDay(preferred)) {
    const match = sorted.find((day) => day >= preferred);
    if (match) return match;
  }
  return sorted[0] ?? '';
}

/**
 * Keeps the preferred clock time when that slot is still available; otherwise clears it so the
 * user chooses again.
 */
export function pickAvailableTime(slots: readonly TimeSlot[], preferred: string): string {
  if (!preferred) return '';
  const slot = slots.find((item) => item.time === preferred && item.isAvailable);
  return slot ? preferred : '';
}
