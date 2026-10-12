import type { BusinessDay } from '@/shared/lib/business-time';
import type { DatePick } from '@/shared/lib/date-filter';

import type { CalendarLocale } from '../primitives/calendar';
import { ActionPicker, DateRangeDialog, type ActionOption, type DateRangeLabels } from './date-pickers';
import { ToolbarField } from './toolbar';

type DateFilterFieldProps = {
  /** A sheet from the bottom on compact layouts, a panel under the field otherwise. */
  compact: boolean;
  className?: string;
  /** The toolbar label of the current filter. */
  label: string;
  title: string;
  subtitle: string;
  /** The sheet's options in order; `custom` opens the range picker. */
  options: readonly ActionOption<DatePick>[];
  onPick: (pick: DatePick) => void;
  rangeOpen: boolean;
  onRangeOpenChange: (open: boolean) => void;
  /** The days the filter covers, which the range picker opens on. */
  range: { from: BusinessDay; to: BusinessDay } | null;
  today: BusinessDay;
  language: CalendarLocale;
  rangeLabels: DateRangeLabels;
  /** A day in the range picker's endpoint fields. */
  formatDay: (day: BusinessDay) => string;
  onApplyRange: (from: BusinessDay, to: BusinessDay) => void;
};

/**
 * The date filter of a list: a toolbar field that opens the quick picks (showAdminDateQuickPickSheet,
 * `_showBlockedSlotsDateFilterSheet`); "Choose a range…" opens the range picker.
 */
export function DateFilterField({
  compact,
  className,
  label,
  title,
  subtitle,
  options,
  onPick,
  rangeOpen,
  onRangeOpenChange,
  range,
  today,
  language,
  rangeLabels,
  formatDay,
  onApplyRange,
}: DateFilterFieldProps) {
  return (
    <>
      <ActionPicker
        compact={compact}
        trigger={<ToolbarField icon="calendar_today_outlined" label={label} className={className} />}
        title={title}
        subtitle={subtitle}
        options={options}
        onPick={onPick}
      />
      <DateRangeDialog
        open={rangeOpen}
        onOpenChange={onRangeOpenChange}
        initial={range}
        today={today}
        language={language}
        formatDay={formatDay}
        labels={rangeLabels}
        onApply={({ from, to }) => {
          onApplyRange(from, to);
        }}
      />
    </>
  );
}
