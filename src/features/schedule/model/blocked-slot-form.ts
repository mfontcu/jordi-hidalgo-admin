import { z } from 'zod';

import {
  addDays,
  businessDayOf,
  clockTimeOfInstant,
  compareDays,
  compareInstants,
  formatDay,
  instantAt,
  isBusinessDay,
  isClockTime,
  minutesOfDay,
  type BusinessDay,
  type ClockTime,
  type DateLocale,
} from '@/shared/lib/business-time';

import { isFullDay, type BlockedSlot } from './blocked-slot';

/** The blocked-slot form (blocked_slot_form.dart). */
export type BlockedSlotFormInput = {
  /** The salon day, or '' before one is chosen. */
  day: string;
  fullDay: boolean;
  start: ClockTime | null;
  end: ClockTime | null;
  reason: string;
  showOnPublicSite: boolean;
};

/** `POST /admin/blocked-slots` and `PUT /admin/blocked-slots/{id}`, in view-model terms. */
export type BlockedSlotInput = {
  startAt: string;
  endAt: string;
  reason: string;
  showOnPublicSite: boolean;
};

export type BlockedSlotFormErrorKey =
  | 'scheduleBlockedSlotFormValidationDate'
  | 'scheduleBlockedSlotFormValidationTime'
  | 'scheduleValidationEndAfterStart'
  | 'scheduleBlockedSlotFormValidationReason';

/** A full day runs from 00:00 to 23:59 in salon time, as Flutter saves it. */
const FULL_DAY = { start: '00:00', end: '23:59' } as const;

/**
 * Validation on submit. Flutter also refuses an end that is not after the start, but silently;
 * here the end field says why.
 */
export const blockedSlotFormSchema = z
  .object({
    day: z.string().refine(isBusinessDay, 'scheduleBlockedSlotFormValidationDate'),
    fullDay: z.boolean(),
    start: z.string().nullable(),
    end: z.string().nullable(),
    reason: z.string().trim().min(1, 'scheduleBlockedSlotFormValidationReason'),
    showOnPublicSite: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.fullDay) return;
    const start = values.start !== null && isClockTime(values.start) ? values.start : null;
    const end = values.end !== null && isClockTime(values.end) ? values.end : null;
    if (start === null) {
      context.addIssue({ code: 'custom', path: ['start'], message: 'scheduleBlockedSlotFormValidationTime' });
    }
    if (end === null) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'scheduleBlockedSlotFormValidationTime' });
    } else if (start !== null && minutesOfDay(end) <= minutesOfDay(start)) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'scheduleValidationEndAfterStart' });
    }
  })
  .transform((values): BlockedSlotInput => {
    const times = values.fullDay ? FULL_DAY : { start: values.start ?? '', end: values.end ?? '' };
    return {
      startAt: instantAt(values.day, times.start),
      endAt: instantAt(values.day, times.end),
      reason: values.reason.trim(),
      showOnPublicSite: values.showOnPublicSite,
    };
  });

/** The form's starting values: empty for a new block, the block's for an edit. */
export function blockedSlotFormDefaults(slot: BlockedSlot | null): BlockedSlotFormInput {
  if (!slot) {
    return { day: '', fullDay: false, start: null, end: null, reason: '', showOnPublicSite: true };
  }
  return {
    day: businessDayOf(slot.startAt) ?? '',
    fullDay: isFullDay(slot),
    start: clockTimeOfInstant(slot.startAt),
    end: clockTimeOfInstant(slot.endAt),
    reason: slot.reason,
    showOnPublicSite: slot.showOnPublicSite,
  };
}

/**
 * The days the date field offers. Flutter offers 2025 to 2027 only; the panel offers from today,
 * or from the block's own day when it is earlier, to three years ahead.
 */
export function blockedSlotDayRange(
  today: BusinessDay,
  slotDay: BusinessDay | null,
): { first: BusinessDay; last: BusinessDay } {
  const first = slotDay && compareDays(slotDay, today) < 0 ? slotDay : today;
  return { first, last: addDays(today, 3 * 365) };
}

/** The preview's date: the field's text, "dd/mm/yyyy" (`dateController.text`). */
export function previewDate(day: string, locale: DateLocale): string | null {
  return isBusinessDay(day) ? formatDay(day, locale, 'numericDate') : null;
}

/** The preview's hours, with "--:--" for a missing time; null for a full day. */
export function previewTimeRange(
  input: Pick<BlockedSlotFormInput, 'fullDay' | 'start' | 'end'>,
): string | null {
  if (input.fullDay) return null;
  return `${input.start ?? '--:--'} - ${input.end ?? '--:--'}`;
}

/** Whether an edit moves the block, so the appointments it covers need checking again. */
export function rangeChanged(slot: BlockedSlot, input: BlockedSlotInput): boolean {
  return compareInstants(slot.startAt, input.startAt) !== 0 || compareInstants(slot.endAt, input.endAt) !== 0;
}
