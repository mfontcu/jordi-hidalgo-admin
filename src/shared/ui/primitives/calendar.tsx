import {
  DayPicker,
  type ChevronProps,
  type DateLib,
  type DayPickerProps,
  type Locale as DayPickerLocale,
} from 'react-day-picker';
import { ca, enUS, es } from 'react-day-picker/locale';

import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { buttonVariants } from './button';

export type CalendarLocale = 'es' | 'ca' | 'en';

const LOCALES: Record<CalendarLocale, DayPickerLocale> = { es, ca, en: enUS };

// Month title as Flutter's DateFormat.yMMMM: "octubre de 2026", "octubre del 2026", "October 2026".
const CAPTION_PATTERN: Record<CalendarLocale, string> = {
  es: "LLLL 'de' y",
  ca: "LLLL 'del' y",
  en: 'LLLL y',
};

// Weekday initials, Sunday first, as Flutter prints them (MaterialLocalizations.narrowWeekdays and
// intl's EEEEE); date-fns differs (for example "M" instead of "X" for Wednesday in Spanish). The
// range grid shows them in upper case, like the admin picker.
const WEEKDAY_INITIALS: Record<CalendarLocale, readonly string[]> = {
  es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  ca: ['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

/** The salon's time zone (ADR-003, "Business time"): days are salon days, whatever the browser zone. */
const BUSINESS_TIME_ZONE = 'Europe/Madrid';

// DayPicker's props are a union on `mode`; omitting per member keeps `mode` and `selected` paired.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type CalendarProps = DistributiveOmit<DayPickerProps, 'locale'> & {
  /** Interface language; sets month and weekday names and, in single mode, the first weekday. */
  language: CalendarLocale;
};

/**
 * Month calendar with the two looks of the Flutter panel:
 * - `mode="single"`: Material's CalendarDatePicker (month title on the left, arrows on the right,
 *   40px round days, the locale's first weekday).
 * - `mode="range"`: the admin date-range grid (pickers/admin_date_range_picker_dialog.dart): a bordered
 *   card, arrows around a centered title, 36px outlined days, weeks from Monday, range fill.
 */
export function Calendar(props: CalendarProps) {
  // DayPicker adds `className` to its root itself.
  const { language, classNames } = props;
  const isRange = props.mode === 'range';
  const captionPattern = CAPTION_PATTERN[language];

  const shared = {
    root: 'relative w-full text-on-surface',
    months: 'relative flex flex-wrap gap-3',
    month: 'flex min-w-0 flex-1 flex-col',
    // A table laid out as grids: header and body rows span the full width.
    month_grid: 'block w-full [&>thead]:block',
    weekdays: 'grid grid-cols-7',
    weeks: 'grid',
    week: 'grid grid-cols-7',
    day: 'relative flex items-center justify-center p-0',
    hidden: 'invisible',
    disabled: 'pointer-events-none',
    chevron: 'fill-current',
  };

  const single = {
    nav: 'absolute top-0 right-0 flex h-[52px] items-center',
    button_previous: buttonVariants({ variant: 'icon' }),
    button_next: buttonVariants({ variant: 'icon' }),
    month_caption: 'flex h-[52px] items-center ps-4 pe-24',
    caption_label: 'text-title-sm text-on-surface-variant',
    weekday: 'flex h-[42px] items-center justify-center text-body-lg font-normal text-on-surface',
    week: 'grid h-[42px] grid-cols-7',
    day_button: cn(
      'relative flex size-10 cursor-pointer items-center justify-center rounded-pill text-body-lg text-on-surface outline-none',
      'before:absolute before:inset-0 before:rounded-pill before:bg-current before:opacity-0 hover:before:opacity-[var(--state-hover)] focus-visible:before:opacity-[var(--state-focus)]',
      'disabled:cursor-default disabled:text-disabled-content disabled:before:hidden',
    ),
    today:
      '[&>button]:border [&>button]:border-primary [&>button]:text-primary [&[data-selected]>button]:text-on-primary',
    selected: '[&>button]:bg-primary [&>button]:text-on-primary',
    outside: 'invisible',
  };

  const range = {
    root: cn(shared.root, 'rounded-lg border border-outline-variant bg-surface p-3.5'),
    nav: 'contents',
    month: 'grid min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-y-2',
    button_previous: cn(buttonVariants({ variant: 'icon' }), 'col-start-1 row-start-1'),
    button_next: cn(buttonVariants({ variant: 'icon' }), 'col-start-3 row-start-1'),
    month_caption: 'col-start-2 row-start-1 flex justify-center',
    caption_label: 'text-[15px] font-extrabold text-on-surface',
    month_grid: 'col-span-3 block w-full [&>thead]:block',
    weekdays: 'mb-3 grid grid-cols-7',
    weekday: 'text-center text-body-md font-bold text-content-secondary',
    weeks: 'grid gap-1.5',
    week: 'grid grid-cols-7 gap-1.5',
    day: 'relative flex aspect-square items-center justify-center p-0',
    day_button: cn(
      'flex size-9 cursor-pointer items-center justify-center rounded-pill border border-outline-variant text-body-md font-extrabold text-on-surface outline-none',
      'hover:bg-[color-mix(in_srgb,var(--on-surface)_8%,transparent)] focus-visible:outline-2 focus-visible:outline-focus',
      'disabled:cursor-default disabled:text-disabled-content',
    ),
    today: '[&>button]:border-[1.5px] [&>button]:border-accent-fg',
    range_middle: 'bg-selection-bg [&>button]:border-selection-border',
    // Endpoints: a primary circle on a stronger fill, rounded on the outer side.
    range_start:
      'rounded-l-pill bg-selection-bg-strong [&>button]:border-primary [&>button]:bg-primary [&>button]:text-on-primary',
    range_end:
      'rounded-r-pill bg-selection-bg-strong [&>button]:border-primary [&>button]:bg-primary [&>button]:text-on-primary',
    outside: 'invisible',
  };

  return (
    <DayPicker
      {...props}
      locale={LOCALES[language]}
      timeZone={BUSINESS_TIME_ZONE}
      weekStartsOn={isRange ? 1 : undefined}
      navLayout={isRange ? 'around' : undefined}
      showOutsideDays={false}
      formatters={{
        formatCaption: (month: Date, _options?: unknown, dateLib?: DateLib) =>
          dateLib ? dateLib.format(month, captionPattern) : '',
        formatWeekdayName: (weekday: Date) => {
          const initial = WEEKDAY_INITIALS[language][weekday.getDay()] ?? '';
          return isRange ? initial.toUpperCase() : initial;
        },
      }}
      components={{ Chevron: CalendarChevron }}
      classNames={{ ...shared, ...(isRange ? range : single), ...classNames }}
    />
  );
}

function CalendarChevron({ orientation }: ChevronProps) {
  return <Icon name={orientation === 'left' ? 'chevron_left_rounded' : 'chevron_right_rounded'} />;
}
