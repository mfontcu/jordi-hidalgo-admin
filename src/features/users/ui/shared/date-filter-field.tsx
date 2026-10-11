import { useIntl, type IntlShape } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import { formatDay, type BusinessDay, type DateLocale } from '@/shared/lib/business-time';
import { ActionPicker, DateRangeDialog, ToolbarField, type ActionOption } from '@/shared/ui';

import {
  DATE_QUICK_PICKS,
  dateRangeLabel,
  type DateFilter,
  type DateQuickPick,
} from '../../model/date-filter';

const ICONS = {
  allTime: 'all_inclusive_rounded',
  today: 'calendar_today_outlined',
  thisMonth: 'calendar_today_outlined',
  custom: 'event_outlined',
} as const;

const localeOf = (intl: IntlShape) => intl.locale as DateLocale;

/** The toolbar label of a date filter (staffDatePresetLabel, staffDateRangeToolbarLabel). */
export function dateFilterLabel(intl: IntlShape, filter: DateFilter): string {
  switch (filter.kind) {
    case 'all':
      return intl.formatMessage({ id: 'clientDateAllHistory' });
    case 'today':
      return intl.formatMessage({ id: 'appointmentDateToday' });
    case 'month':
      return intl.formatMessage({ id: 'adminCommonThisMonth' });
    case 'range':
      return dateRangeLabel(filter.from, filter.to, localeOf(intl));
  }
}

type DateFilterFieldProps = {
  compact: boolean;
  className?: string;
  filter: DateFilter;
  today: BusinessDay;
  /** The days the filter covers, which the range picker opens on. */
  range: { from: BusinessDay; to: BusinessDay } | null;
  title: MessageId;
  subtitle: MessageId;
  onPick: (pick: DateQuickPick) => void;
  rangeOpen: boolean;
  onRangeOpenChange: (open: boolean) => void;
  onApplyRange: (from: BusinessDay, to: BusinessDay) => void;
};

/**
 * The registration-date filter of a users list: a toolbar field that opens the quick picks
 * (showAdminDateQuickPickSheet); "Choose a range…" opens the range picker.
 */
export function DateFilterField({
  compact,
  className,
  filter,
  today,
  range,
  title,
  subtitle,
  onPick,
  rangeOpen,
  onRangeOpenChange,
  onApplyRange,
}: DateFilterFieldProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = localeOf(intl);

  // clientDateQuickPickLabel.
  const pickLabels: Record<DateQuickPick, string> = {
    allTime: text('clientDateAllHistory'),
    today: intl.formatMessage(
      { id: 'appointmentDateTodayWithDate' },
      { date: formatDay(today, locale, 'longDate') },
    ),
    thisMonth: text('adminCommonThisMonth'),
    custom: text('clientDateCustomRange'),
  };
  const options: ActionOption<DateQuickPick>[] = DATE_QUICK_PICKS.map((pick) => ({
    value: pick,
    icon: ICONS[pick],
    label: pickLabels[pick],
  }));

  return (
    <>
      <ActionPicker
        compact={compact}
        trigger={
          <ToolbarField
            icon="calendar_today_outlined"
            label={dateFilterLabel(intl, filter)}
            className={className}
          />
        }
        title={text(title)}
        subtitle={text(subtitle)}
        options={options}
        onPick={onPick}
      />
      <DateRangeDialog
        open={rangeOpen}
        onOpenChange={onRangeOpenChange}
        initial={range}
        today={today}
        language={locale}
        formatDay={(day) => formatDay(day, locale, 'listDate')}
        labels={{
          title: text('clientDateChooseRangeTitle'),
          start: text('adminDateRangeStartLabel'),
          end: text('adminDateRangeEndLabel'),
          notSelected: text('adminDateRangeNotSelected'),
          last7Days: text('adminDateRangePresetLast7Days'),
          last30Days: text('adminDateRangePresetLast30Days'),
          thisMonth: text('adminCommonThisMonth'),
          clear: text('clientDateClearRange'),
          cancel: text('adminCommonCancel'),
          apply: text('clientDateApplyRange'),
          previousMonth: text('dayAgendaPrevMonth'),
          nextMonth: text('dayAgendaNextMonth'),
        }}
        onApply={({ from, to }) => {
          onApplyRange(from, to);
        }}
      />
    </>
  );
}
