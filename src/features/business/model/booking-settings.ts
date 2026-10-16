import { z } from 'zod';

import { compareDays, isBusinessDay, type BusinessDay } from '@/shared/lib/business-time';

export type BookingSettings = {
  id: string;
  slotIntervalMinutes: number;
  minCancellationNoticeMinutes: number;
  bookingMaxAdvanceDays: number;
  futureAppointmentLimit: number;
  appointmentChangeLimit: number;
  availabilityReadLimit: number;
  bookingFirstDate: BusinessDay | null;
  bookingLastDate: BusinessDay | null;
};

export type BookingSettingsFormInput = {
  slotIntervalMinutes: string;
  minCancellationNoticeMinutes: string;
  bookingMaxAdvanceDays: string;
  futureAppointmentLimit: string;
  appointmentChangeLimit: string;
  availabilityReadLimit: string;
  bookingFirstDate: BusinessDay | null;
  bookingLastDate: BusinessDay | null;
};

export type BookingSettingsUpdate = {
  slotIntervalMinutes: number;
  minCancellationNoticeMinutes: number;
  bookingMaxAdvanceDays: number;
  futureAppointmentLimit: number;
  appointmentChangeLimit: number;
  availabilityReadLimit: number;
  bookingFirstDate?: string;
  bookingLastDate?: string;
};

export type BookingSettingsFormErrorKey =
  | 'businessValidationValidNumber'
  | 'businessValidationPositiveNumber'
  | 'businessValidationNonNegativeNumber'
  | 'businessBookingDateRangeError';

function parseInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export const bookingSettingsFormSchema = z
  .object({
    slotIntervalMinutes: z.string(),
    minCancellationNoticeMinutes: z.string(),
    bookingMaxAdvanceDays: z.string(),
    futureAppointmentLimit: z.string(),
    appointmentChangeLimit: z.string(),
    availabilityReadLimit: z.string(),
    bookingFirstDate: z.string().nullable(),
    bookingLastDate: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    const slot = parseInteger(value.slotIntervalMinutes);
    if (slot === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['slotIntervalMinutes'],
        message: 'businessValidationValidNumber',
      });
    } else if (slot <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['slotIntervalMinutes'],
        message: 'businessValidationPositiveNumber',
      });
    }

    const notice = parseInteger(value.minCancellationNoticeMinutes);
    if (notice === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['minCancellationNoticeMinutes'],
        message: 'businessValidationValidNumber',
      });
    } else if (notice < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['minCancellationNoticeMinutes'],
        message: 'businessValidationNonNegativeNumber',
      });
    }

    const advance = parseInteger(value.bookingMaxAdvanceDays);
    if (advance === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['bookingMaxAdvanceDays'],
        message: 'businessValidationValidNumber',
      });
    } else if (advance <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['bookingMaxAdvanceDays'],
        message: 'businessValidationPositiveNumber',
      });
    }

    const futureLimit = parseInteger(value.futureAppointmentLimit);
    if (futureLimit === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['futureAppointmentLimit'],
        message: 'businessValidationValidNumber',
      });
    } else if (futureLimit < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['futureAppointmentLimit'],
        message: 'businessValidationNonNegativeNumber',
      });
    }

    const changeLimit = parseInteger(value.appointmentChangeLimit);
    if (changeLimit === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['appointmentChangeLimit'],
        message: 'businessValidationValidNumber',
      });
    } else if (changeLimit < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['appointmentChangeLimit'],
        message: 'businessValidationNonNegativeNumber',
      });
    }

    const readLimit = parseInteger(value.availabilityReadLimit);
    if (readLimit === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['availabilityReadLimit'],
        message: 'businessValidationValidNumber',
      });
    } else if (readLimit < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['availabilityReadLimit'],
        message: 'businessValidationNonNegativeNumber',
      });
    }

    const first = value.bookingFirstDate;
    const last = value.bookingLastDate;
    if (first && !isBusinessDay(first)) {
      ctx.addIssue({
        code: 'custom',
        path: ['bookingFirstDate'],
        message: 'businessValidationValidNumber',
      });
    }
    if (last && !isBusinessDay(last)) {
      ctx.addIssue({
        code: 'custom',
        path: ['bookingLastDate'],
        message: 'businessValidationValidNumber',
      });
    }
    if (first && last && isBusinessDay(first) && isBusinessDay(last) && compareDays(first, last) > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['bookingFirstDate'],
        message: 'businessBookingDateRangeError',
      });
    }
  });

export function bookingSettingsFormValues(settings: BookingSettings): BookingSettingsFormInput {
  return {
    slotIntervalMinutes: String(settings.slotIntervalMinutes),
    minCancellationNoticeMinutes: String(settings.minCancellationNoticeMinutes),
    bookingMaxAdvanceDays: String(settings.bookingMaxAdvanceDays),
    futureAppointmentLimit: String(settings.futureAppointmentLimit),
    appointmentChangeLimit: String(settings.appointmentChangeLimit),
    availabilityReadLimit: String(settings.availabilityReadLimit),
    bookingFirstDate: settings.bookingFirstDate,
    bookingLastDate: settings.bookingLastDate,
  };
}

export function toBookingSettingsUpdate(input: BookingSettingsFormInput): BookingSettingsUpdate {
  const slot = parseInteger(input.slotIntervalMinutes);
  const notice = parseInteger(input.minCancellationNoticeMinutes);
  const advance = parseInteger(input.bookingMaxAdvanceDays);
  const futureLimit = parseInteger(input.futureAppointmentLimit);
  const changeLimit = parseInteger(input.appointmentChangeLimit);
  const readLimit = parseInteger(input.availabilityReadLimit);
  if (
    slot === null ||
    notice === null ||
    advance === null ||
    futureLimit === null ||
    changeLimit === null ||
    readLimit === null
  ) {
    throw new Error('Booking settings form must be validated before update');
  }
  return {
    slotIntervalMinutes: slot,
    minCancellationNoticeMinutes: notice,
    bookingMaxAdvanceDays: advance,
    futureAppointmentLimit: futureLimit,
    appointmentChangeLimit: changeLimit,
    availabilityReadLimit: readLimit,
    ...(input.bookingFirstDate ? { bookingFirstDate: input.bookingFirstDate } : {}),
    ...(input.bookingLastDate ? { bookingLastDate: input.bookingLastDate } : {}),
  };
}
