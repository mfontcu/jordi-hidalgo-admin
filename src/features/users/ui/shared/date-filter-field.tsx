import { useIntl, type IntlShape } from 'react-intl';

import { dateRangeDialogLabels, type MessageId } from '@/shared/i18n';
import { formatDay, type BusinessDay, type DateLocale } from '@/shared/lib/business-time';
import { dateRangeLabel, type DateFilter, type DatePick } from '@/shared/lib/date-filter';
import { DateFilterField as KitDateFilterField, type ActionOption } from '@/shared/ui';

import { DATE_QUICK_PICKS } from '../../model/date-filter';

const ICONS = {
  all: 'all_inclusive_rounded',
  today: 'calendar_today_outlined',
  month: 'calendar_today_outlined',
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
    case 'tomorrow':
      return intl.formatMessage({ id: 'appointmentDateTomorrow' });
    case 'thisWeek':
      return intl.formatMessage({ id: 'appointmentDateThisWeek' });
    case 'thisMonth':
    case 'month':
      return intl.formatMessage({ id: 'adminCommonThisMonth' });
    case 'next7Days':
      return intl.formatMessage({ id: 'scheduleBlockedSlotDateNext7Days' });
    case 'nextMonth':
      return intl.formatMessage({ id: 'scheduleBlockedSlotDateNextMonth' });
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
  onPick: (pick: DatePick) => void;
  rangeOpen: boolean;
  onRangeOpenChange: (open: boolean) => void;
  onApplyRange: (from: BusinessDay, to: BusinessDay) => void;
};

/** The registration-date filter of a users list, with the users lists' quick picks. */
export function DateFilterField({ filter, title, subtitle, ...props }: DateFilterFieldProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = localeOf(intl);

  // clientDateQuickPickLabel.
  const pickLabels: Record<(typeof DATE_QUICK_PICKS)[number], string> = {
    all: text('clientDateAllHistory'),
    today: intl.formatMessage(
      { id: 'appointmentDateTodayWithDate' },
      { date: formatDay(props.today, locale, 'longDate') },
    ),
    month: text('adminCommonThisMonth'),
    custom: text('clientDateCustomRange'),
  };
  const options: ActionOption<DatePick>[] = DATE_QUICK_PICKS.map((pick) => ({
    value: pick,
    icon: ICONS[pick],
    label: pickLabels[pick],
  }));

  return (
    <KitDateFilterField
      {...props}
      label={dateFilterLabel(intl, filter)}
      title={text(title)}
      subtitle={text(subtitle)}
      options={options}
      language={locale}
      rangeLabels={dateRangeDialogLabels(intl)}
      formatDay={(day) => formatDay(day, locale, 'listDate')}
    />
  );
}
