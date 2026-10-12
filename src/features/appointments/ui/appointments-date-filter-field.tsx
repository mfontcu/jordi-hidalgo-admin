import { useIntl, type IntlShape } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import { addDays, formatDay, type BusinessDay, type DateLocale } from '@/shared/lib/business-time';
import { dateRangeLabel, type DateFilter, type DatePick } from '@/shared/lib/date-filter';
import { DateFilterField as KitDateFilterField, type ActionOption } from '@/shared/ui';

import { APPOINTMENT_DATE_PICKS } from '../model/appointments-search';

const ICONS = {
  today: 'calendar_today_outlined',
  tomorrow: 'calendar_today_outlined',
  thisWeek: 'calendar_today_outlined',
  thisMonth: 'calendar_today_outlined',
  custom: 'event_outlined',
} as const;

const localeOf = (intl: IntlShape) => intl.locale as DateLocale;

/** Toolbar label for the appointments list date filter. */
export function appointmentListDateLabel(intl: IntlShape, filter: DateFilter, today: BusinessDay): string {
  const locale = localeOf(intl);
  switch (filter.kind) {
    case 'today':
      return intl.formatMessage(
        { id: 'appointmentDateTodayWithDate' },
        { date: formatDay(today, locale, 'longDate') },
      );
    case 'tomorrow':
      return intl.formatMessage(
        { id: 'appointmentDateTomorrowWithDate' },
        { date: formatDay(addDays(today, 1), locale, 'longDate') },
      );
    case 'thisWeek':
      return intl.formatMessage({ id: 'appointmentDateThisWeek' });
    case 'thisMonth':
      return intl.formatMessage({ id: 'appointmentDateThisMonth' });
    case 'range':
      return dateRangeLabel(filter.from, filter.to, locale);
    default:
      return intl.formatMessage({ id: 'appointmentDateToday' });
  }
}

type AppointmentsDateFilterFieldProps = {
  compact: boolean;
  className?: string;
  filter: DateFilter;
  today: BusinessDay;
  range: { from: BusinessDay; to: BusinessDay } | null;
  onPick: (pick: DatePick) => void;
  rangeOpen: boolean;
  onRangeOpenChange: (open: boolean) => void;
  onApplyRange: (from: BusinessDay, to: BusinessDay) => void;
};

/** Date filter for `/appointments` (AppointmentDatePreset quick picks + range). */
export function AppointmentsDateFilterField({ filter, today, ...props }: AppointmentsDateFilterFieldProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = localeOf(intl);

  const pickLabels: Record<(typeof APPOINTMENT_DATE_PICKS)[number], string> = {
    today: intl.formatMessage(
      { id: 'appointmentDateTodayWithDate' },
      { date: formatDay(today, locale, 'longDate') },
    ),
    tomorrow: intl.formatMessage(
      { id: 'appointmentDateTomorrowWithDate' },
      { date: formatDay(addDays(today, 1), locale, 'longDate') },
    ),
    thisWeek: text('appointmentDateThisWeek'),
    thisMonth: text('appointmentDateThisMonth'),
    custom: text('appointmentDateChooseRange'),
  };
  const options: ActionOption<DatePick>[] = APPOINTMENT_DATE_PICKS.map((pick) => ({
    value: pick,
    icon: ICONS[pick],
    label: pickLabels[pick],
  }));

  const rangeLabels = {
    title: text('appointmentDateRangeTitle'),
    subtitle: text('appointmentDateRangeSubtitle'),
    start: text('adminDateRangeStartLabel'),
    end: text('adminDateRangeEndLabel'),
    notSelected: text('adminDateRangeNotSelected'),
    last7Days: text('adminDateRangePresetLast7Days'),
    last30Days: text('adminDateRangePresetLast30Days'),
    thisMonth: text('adminCommonThisMonth'),
    clear: text('appointmentDateRangeClear'),
    cancel: text('adminCommonCancel'),
    apply: text('appointmentDateRangeApply'),
    previousMonth: text('dayAgendaPrevMonth'),
    nextMonth: text('dayAgendaNextMonth'),
  };

  return (
    <KitDateFilterField
      {...props}
      label={appointmentListDateLabel(intl, filter, today)}
      title={text('appointmentDateFilterTitle')}
      subtitle={text('appointmentDateFilterSubtitle')}
      options={options}
      today={today}
      language={locale}
      rangeLabels={rangeLabels}
      formatDay={(day) => formatDay(day, locale, 'listDate')}
    />
  );
}
