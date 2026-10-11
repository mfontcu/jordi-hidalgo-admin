import { useState, useSyncExternalStore, type ReactNode } from 'react';

import {
  addDays,
  addMonths,
  compareDays,
  dateToDay,
  dayToDate,
  endOfMonth,
  formatMonth,
  startOfMonth,
  type BusinessDay,
} from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Button } from '../primitives/button';
import { Calendar, type CalendarLocale } from '../primitives/calendar';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../primitives/sheet';
import { AccentIcon } from './toolbar';

/** Whether the window is narrower than `width` (Flutter `MediaQuery.sizeOf(context).width`). */
export function useWindowNarrowerThan(width: number): boolean {
  const query = `(max-width: ${width - 0.02}px)`;
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    () => window.matchMedia(query).matches,
  );
}

export type ActionOption<T extends string> = { value: T; icon: IconName; label: string };

type ActionPickerProps<T extends string> = {
  /** A sheet from the bottom on compact layouts, a panel under the trigger otherwise. */
  compact: boolean;
  trigger: ReactNode;
  title: string;
  subtitle: string;
  options: readonly ActionOption<T>[];
  onPick: (value: T) => void;
};

/**
 * A list of actions to pick one from (showAdminDateQuickPickSheet, showAdminActionListSheet): a
 * tile per option. Flutter opens a bottom sheet at every width; on wide layouts this opens a panel
 * under the trigger, as the list filter does.
 */
export function ActionPicker<T extends string>({
  compact,
  trigger,
  title,
  subtitle,
  options,
  onPick,
}: ActionPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const tiles = (
    <ul className="flex flex-col gap-2.5">
      {options.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onPick(option.value);
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-outline-variant bg-surface p-4 text-left hover:bg-[color-mix(in_srgb,var(--on-surface)_4%,var(--surface))]"
          >
            <AccentIcon name={option.icon} size={20} compact />
            <span className="min-w-0 flex-1 font-bold text-on-surface">{option.label}</span>
            <Icon name="chevron_right_rounded" className="text-icon-accent/65" />
          </button>
        </li>
      ))}
    </ul>
  );

  if (compact) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent>
          <SheetBody>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{subtitle}</SheetDescription>
            </SheetHeader>
            {tiles}
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="flex w-[420px] flex-col p-5">
        <p className="text-dialog-title font-black text-on-surface">{title}</p>
        <p className="mt-2 text-body-md leading-[1.5] text-content-secondary">{subtitle}</p>
        <div className="mt-5">{tiles}</div>
      </PopoverContent>
    </Popover>
  );
}

export type DayRange = { from: BusinessDay; to: BusinessDay };

export type DateRangeLabels = {
  title: string;
  start: string;
  end: string;
  notSelected: string;
  last7Days: string;
  last30Days: string;
  thisMonth: string;
  clear: string;
  cancel: string;
  apply: string;
  previousMonth: string;
  nextMonth: string;
};

type DateRangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The range it opens on; without one, today. */
  initial: DayRange | null;
  today: BusinessDay;
  language: CalendarLocale;
  labels: DateRangeLabels;
  /** A day in the endpoint fields (`DateFormat('d MMM y')`). */
  formatDay: (day: BusinessDay) => string;
  onApply: (range: DayRange) => void;
};

/**
 * showAdminDateRangePickerDialog: start and end fields, quick ranges, the month grids, and
 * cancel or apply. A dialog with two months; under 720px of window, a sheet with one.
 */
export function DateRangeDialog({ open, onOpenChange, ...props }: DateRangeDialogProps) {
  const compact = useWindowNarrowerThan(720);
  // The content mounts on each opening, so it starts from `initial`.
  const content = open && (
    <DateRangeContent
      {...props}
      compact={compact}
      onCancel={() => {
        onOpenChange(false);
      }}
    />
  );

  if (compact) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent aria-describedby={undefined}>
          <SheetBody>
            <SheetHeader>
              <SheetTitle>{props.labels.title}</SheetTitle>
            </SheetHeader>
            {content}
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-[720px] p-5">
        <DialogTitle className="mb-4 text-[22px] font-black">{props.labels.title}</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}

type Endpoint = 'start' | 'end';

type Selection = {
  start: BusinessDay | null;
  end: BusinessDay | null;
  completed: boolean;
  active: Endpoint | null;
  month: BusinessDay;
};

/** `_onDaySelected`: what a tapped day does with the active endpoint and the current range. */
export function selectDay(selection: Selection, day: BusinessDay): Selection {
  const startOver: Selection = { ...selection, start: day, end: null, completed: false, active: 'end' };
  const finish: Selection = { ...selection, end: day, completed: true, active: null };
  const { start, active, completed } = selection;
  if (active === 'start') return startOver;
  if (active === 'end') {
    if (start === null || compareDays(day, start) < 0) return { ...startOver, active: 'end' };
    return finish;
  }
  if (start === null || completed || compareDays(day, start) < 0) return startOver;
  return finish;
}

type ContentProps = Omit<DateRangeDialogProps, 'open' | 'onOpenChange'> & {
  compact: boolean;
  onCancel: () => void;
};

function DateRangeContent({
  initial,
  today,
  language,
  labels,
  formatDay,
  onApply,
  compact,
  onCancel,
}: ContentProps) {
  const first = initial ?? { from: today, to: today };
  const [selection, setSelection] = useState<Selection>({
    start: first.from,
    end: first.to,
    completed: true,
    active: null,
    month: startOfMonth(first.from),
  });
  const { start, end, completed, active, month } = selection;

  const preset = (from: BusinessDay, to: BusinessDay) => {
    setSelection({ start: from, end: to, completed: true, active: null, month: startOfMonth(from) });
  };
  const tapEndpoint = (endpoint: Endpoint) => {
    setSelection((current) => {
      const focus = endpoint === 'start' ? (current.start ?? today) : (current.end ?? current.start ?? today);
      return {
        ...current,
        active: endpoint,
        month: startOfMonth(focus),
        ...(endpoint === 'start' ? { end: null, completed: false } : {}),
      };
    });
  };

  const months = compact ? 1 : 2;
  const monthTitle = (day: BusinessDay) => formatMonth(day, language);

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <EndpointField
          label={labels.start}
          value={start ? formatDay(start) : labels.notSelected}
          active={active === 'start'}
          onClick={() => {
            tapEndpoint('start');
          }}
        />
        <Icon name="arrow_forward_rounded" size={18} className="mx-2 text-content-secondary" />
        <EndpointField
          label={labels.end}
          value={end ? formatDay(end) : labels.notSelected}
          active={active === 'end'}
          onClick={() => {
            tapEndpoint(start === null ? 'start' : 'end');
          }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PresetChip
          label={labels.last7Days}
          onClick={() => {
            preset(addDays(today, -6), today);
          }}
        />
        <PresetChip
          label={labels.last30Days}
          onClick={() => {
            preset(addDays(today, -29), today);
          }}
        />
        <PresetChip
          label={labels.thisMonth}
          onClick={() => {
            preset(startOfMonth(today), endOfMonth(today));
          }}
        />
        <PresetChip
          muted
          label={labels.clear}
          onClick={() => {
            setSelection({
              start: null,
              end: null,
              completed: false,
              active: 'start',
              month: startOfMonth(today),
            });
          }}
        />
      </div>
      <div className="mt-4 rounded-lg border border-outline-variant bg-surface p-3.5">
        <div className="flex items-center">
          <Button
            variant="icon"
            aria-label={labels.previousMonth}
            onClick={() => {
              setSelection((current) => ({ ...current, month: addMonths(current.month, -1) }));
            }}
          >
            <Icon name="chevron_left_rounded" />
          </Button>
          <p className="flex-1 text-center text-[15px] font-extrabold text-on-surface">
            {months === 2 ? `${monthTitle(month)} – ${monthTitle(addMonths(month, 1))}` : monthTitle(month)}
          </p>
          <Button
            variant="icon"
            aria-label={labels.nextMonth}
            onClick={() => {
              setSelection((current) => ({ ...current, month: addMonths(current.month, 1) }));
            }}
          >
            <Icon name="chevron_right_rounded" />
          </Button>
        </div>
        <Calendar
          mode="range"
          language={language}
          numberOfMonths={months}
          month={dayToDate(month)}
          onMonthChange={(value) => {
            setSelection((current) => ({ ...current, month: startOfMonth(dateToDay(value)) }));
          }}
          hideNavigation
          today={dayToDate(today)}
          // The fill shows once both ends are chosen; until then only the start is marked.
          selected={
            start ? { from: dayToDate(start), to: completed && end ? dayToDate(end) : undefined } : undefined
          }
          onSelect={() => undefined}
          onDayClick={(value) => {
            setSelection((current) => selectDay(current, dateToDay(value)));
          }}
          classNames={{
            root: 'relative mt-2 w-full text-on-surface',
            months: 'relative flex gap-3',
            month: 'flex min-w-0 flex-1 flex-col',
            month_caption: 'hidden',
          }}
        />
      </div>
      <div className="mt-5 flex gap-3 [&>*]:flex-1">
        <Button variant="secondary" icon="close_rounded" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button
          icon="check_rounded"
          disabled={!(start && end && completed)}
          onClick={() => {
            if (start && end && completed) onApply({ from: start, to: end });
          }}
        >
          {labels.apply}
        </Button>
      </div>
    </div>
  );
}

type EndpointFieldProps = { label: string; value: string; active: boolean; onClick: () => void };

/** `_RangeEndpointField`: label over the chosen day; the active one in the accent color. */
function EndpointField({ label, value, active, onClick }: EndpointFieldProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-1 cursor-pointer flex-col items-start rounded-md bg-surface p-3 text-left hover:bg-[color-mix(in_srgb,var(--on-surface)_4%,var(--surface))]',
        active ? 'border-[1.5px] border-accent-fg' : 'border border-outline-variant',
      )}
    >
      <span className={cn('text-[12px] font-bold', active ? 'text-accent-fg' : 'text-content-secondary')}>
        {label}
      </span>
      <span className="mt-1 w-full truncate text-[15px] font-extrabold text-on-surface">{value}</span>
    </button>
  );
}

function PresetChip({
  label,
  onClick,
  muted = false,
}: {
  label: string;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 cursor-pointer items-center rounded-pill border border-outline-variant bg-surface px-4 text-body-md font-bold hover:bg-[color-mix(in_srgb,var(--on-surface)_8%,var(--surface))]',
        muted ? 'text-content-secondary' : 'text-on-surface',
      )}
    >
      {label}
    </button>
  );
}
