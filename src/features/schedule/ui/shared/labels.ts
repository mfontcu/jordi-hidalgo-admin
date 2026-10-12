import type { IntlShape } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import type { DateLocale } from '@/shared/lib/business-time';
import type { DateInputLabels, TimePickerLabels } from '@/shared/ui';

import { blockedSlotTimeRange, type BlockedSlot } from '../../model/blocked-slot';
import { ruleReasonOf, weekdayLabelOf, type RecurringRule } from '../../model/recurring-rule';

export const localeOf = (intl: IntlShape) => intl.locale as DateLocale;

/** Parts of a label joined by a middle dot, as the Flutter screens write them: "lun · 11:00". */
export const dotted = (...parts: string[]) => parts.join(' · ');

export const textOf = (intl: IntlShape) => (id: MessageId) => intl.formatMessage({ id });

/** scheduleWeekdayLabel. */
export function weekdayName(intl: IntlShape, weekday: number): string {
  return intl.formatMessage({ id: weekdayLabelOf(weekday) });
}

/** scheduleBlockedSlotTimeLabel: the hours, or "Full day". */
export function blockedSlotTimeText(intl: IntlShape, slot: Pick<BlockedSlot, 'startAt' | 'endAt'>): string {
  return blockedSlotTimeRange(slot) ?? intl.formatMessage({ id: 'scheduleBlockedSlotFullDayLabel' });
}

/** A rule's reason, or "No reason set" for an empty one. */
export function ruleReasonText(intl: IntlShape, rule: Pick<RecurringRule, 'reason'>): string {
  return ruleReasonOf(rule) ?? intl.formatMessage({ id: 'scheduleNoReasonDefined' });
}

/** The time picker's copy, with the dialog's help text. */
export function timePickerLabels(intl: IntlShape, help: MessageId): TimePickerLabels {
  const text = textOf(intl);
  return {
    help: text(help),
    cancel: text('adminCommonCancel'),
    confirm: text('scheduleTimePickerConfirm'),
    hour: text('adminTimePickerHourLabel'),
    minute: text('adminTimePickerMinuteLabel'),
    inputMode: text('adminTimePickerInputModeTooltip'),
    dialMode: text('adminTimePickerDialModeTooltip'),
    invalid: text('adminTimePickerInvalidTime'),
    am: text('adminTimePickerAm'),
    pm: text('adminTimePickerPm'),
  };
}

/** AdminDateInputField's dialog copy. */
export function dateInputLabels(intl: IntlShape): DateInputLabels {
  const text = textOf(intl);
  return {
    title: text('adminDateInputTitle'),
    subtitle: text('adminDateInputSubtitle'),
    apply: text('adminDateInputApply'),
    cancel: text('adminCommonCancel'),
  };
}
