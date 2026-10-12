import type { components } from '@/shared/api';
import { parseClockTime, type Weekday } from '@/shared/lib/business-time';

import type { BlockedSlot, BlockedSlotPage, BlockedSlotsSummary } from '../model/blocked-slot';
import type { RecurringRule, RecurringRuleList, RuleException } from '../model/recurring-rule';
import { shiftsOf, type WorkingDay, type WorkingHours } from '../model/working-hours';

type Schemas = components['schemas'];
type BusinessHoursDto = Schemas['dto.AdminBusinessHoursResponse'];
type BusinessHoursDayDto = Schemas['dto.AdminBusinessHoursDayResponse'];
type BlockedSlotDto = Schemas['dto.AdminBlockedSlotResponse'];
type BlockedSlotListDto = Schemas['dto.AdminBlockedSlotsListResponse'];
type RecurringRuleDto = Schemas['dto.AdminRecurringBlockedSlotResponse'];
type RecurringRuleListDto = Schemas['dto.AdminRecurringBlockedSlotsListResponse'];
type RuleExceptionDto = Schemas['dto.AdminRecurringBlockedSlotExceptionResponse'];

/** A weekday the API sends; anything outside 1–7 is kept so the panel can say it is invalid. */
const weekdayOf = (value: number | undefined) => (value ?? 0) as Weekday;

const clock = (value: string | undefined) => parseClockTime(value) ?? '00:00';

const textOrNull = (value: string | undefined) => {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};

function toWorkingDay(dto: BusinessHoursDayDto): WorkingDay {
  const slots = (dto.slots ?? []).map((slot) => ({
    id: slot.id ?? '',
    start: clock(slot.startTime),
    end: clock(slot.endTime),
  }));
  return {
    weekday: weekdayOf(dto.weekday),
    label: dto.label ?? '',
    isActive: dto.isActive ?? false,
    ...shiftsOf(slots),
  };
}

export function toWorkingHours(dto: BusinessHoursDto): WorkingHours {
  return {
    days: (dto.days ?? []).map(toWorkingDay),
    summary: {
      activeDays: dto.summary?.activeDays ?? 0,
      activeWeekendDays: dto.summary?.activeWeekendDays ?? 0,
      usualOpening: textOrNull(dto.summary?.usualOpeningTime),
      usualClosing: textOrNull(dto.summary?.usualClosingTime),
    },
  };
}

export function toBlockedSlot(dto: BlockedSlotDto): BlockedSlot {
  return {
    id: dto.id ?? '',
    startAt: dto.start_at ?? '',
    endAt: dto.end_at ?? '',
    reason: dto.reason ?? '',
    showOnPublicSite: dto.show_on_public_site ?? false,
  };
}

export function toBlockedSlotPage(dto: BlockedSlotListDto, page: number, pageSize: number): BlockedSlotPage {
  const summary: BlockedSlotsSummary = {
    activeBlocks: dto.summary?.active_blocks ?? 0,
    fullDayClosures: dto.summary?.full_day_closures ?? 0,
    partialRanges: dto.summary?.partial_blocked_ranges ?? 0,
    next: dto.summary?.next_blocked_slot?.id ? toBlockedSlot(dto.summary.next_blocked_slot) : null,
  };
  return {
    items: (dto.items ?? []).map(toBlockedSlot),
    page,
    pageSize,
    totalItems: summary.fullDayClosures + summary.partialRanges,
    summary,
  };
}

export function toRecurringRule(dto: RecurringRuleDto): RecurringRule {
  return {
    id: dto.id ?? '',
    weekday: weekdayOf(dto.weekday),
    start: clock(dto.start_time),
    end: clock(dto.end_time),
    reason: dto.reason ?? '',
    isActive: dto.is_active ?? false,
  };
}

export function toRecurringRuleList(dto: RecurringRuleListDto): RecurringRuleList {
  return {
    items: (dto.items ?? []).map(toRecurringRule),
    summary: {
      activeRules: dto.summary?.active_rules ?? 0,
      affectedDays: dto.summary?.affected_days ?? 0,
      weeklyRanges: dto.summary?.weekly_blocked_ranges ?? 0,
      next: dto.summary?.next_rule?.id ? toRecurringRule(dto.summary.next_rule) : null,
    },
  };
}

export function toRuleException(dto: RuleExceptionDto): RuleException {
  return {
    id: dto.id ?? '',
    // A salon day, 'YYYY-MM-DD'.
    date: dto.date ?? '',
    action: dto.action ?? '',
    reason: dto.reason ?? '',
  };
}
