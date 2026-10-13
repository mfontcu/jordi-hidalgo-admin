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
 * Month calendar. Titles, weekday initials, and the week start stay as they are.
 * Day cells are squares with a 6px radius.
 * - `mode="single"`: month title on the left, arrows on the right, the locale's first weekday.
 * - `mode="range"`: a bordered card, arrows around a centered title, weeks from Monday, range fill.
 */
export function Calendar(props: CalendarProps) {
  // DayPicker adds `className` to its root itself.
  const { language, classNames } = props;
  const isRange = props.mode === 'range';
  const captionPattern = CAPTION_PATTERN[language];

  const shared = {
    root: 'relative w-full text-foreground',
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
    nav: 'absolute top-0 right-0 flex h-control items-center',
    button_previous: cn(buttonVariants({ variant: 'icon' })),
    button_next: cn(buttonVariants({ variant: 'icon' })),
    month_caption: 'flex h-control items-center ps-3 pe-24',
    caption_label: 'text-body-strong text-muted-foreground',
    weekday: 'flex h-8 items-center justify-center text-caption text-muted-foreground',
    week: 'grid h-10 grid-cols-7',
    day_button: cn(
      'flex size-9 cursor-pointer items-center justify-center rounded-md text-body text-foreground',
      'hover:bg-muted',
      'disabled:cursor-default disabled:text-disabled-foreground disabled:hover:bg-transparent',
    ),
    today: '[&>button]:border [&>button]:border-foreground [&[data-selected]>button]:text-primary-foreground',
    selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
    outside: 'invisible',
  };

  const range = {
    root: cn(shared.root, 'rounded-lg border border-border bg-card p-4'),
    nav: 'contents',
    month: 'grid min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-y-2',
    button_previous: cn(buttonVariants({ variant: 'icon' }), 'col-start-1 row-start-1'),
    button_next: cn(buttonVariants({ variant: 'icon' }), 'col-start-3 row-start-1'),
    month_caption: 'col-start-2 row-start-1 flex justify-center',
    caption_label: 'text-body-strong text-foreground',
    month_grid: 'col-span-3 block w-full [&>thead]:block',
    weekdays: 'mb-2 grid grid-cols-7',
    weekday: 'text-center text-caption text-muted-foreground',
    weeks: 'grid gap-1',
    week: 'grid grid-cols-7 gap-1',
    day: 'relative flex aspect-square items-center justify-center p-0',
    day_button: cn(
      'flex size-full cursor-pointer items-center justify-center rounded-md border border-border text-body text-foreground',
      'hover:bg-muted',
      'disabled:cursor-default disabled:text-disabled-foreground disabled:hover:bg-transparent',
    ),
    today: '[&>button]:border-foreground',
    range_middle: 'bg-selection-wash [&>button]:border-transparent [&>button]:hover:bg-transparent',
    range_start:
      'rounded-l-md bg-selection-wash [&>button]:border-primary [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
    range_end:
      'rounded-r-md bg-selection-wash [&>button]:border-primary [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
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
  return <Icon name={orientation === 'left' ? 'chevron_left_rounded' : 'chevron_right_rounded'} size={20} />;
}
