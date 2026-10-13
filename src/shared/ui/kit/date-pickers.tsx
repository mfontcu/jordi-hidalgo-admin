import { useState, type ReactNode } from 'react';

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
import { AccentIcon, useWindowNarrowerThan } from './toolbar';

export { useWindowNarrowerThan };

export type ActionOption<T extends string> = { value: T; icon: IconName; label: string };

type ActionPickerProps<T extends string> = {
  /**
   * Kept so current screens still type-check. The container follows the viewport: a sheet under
   * 768px, a popover from 768px.
   */
  compact: boolean;
  trigger: ReactNode;
  title: string;
  subtitle: string;
  options: readonly ActionOption<T>[];
  onPick: (value: T) => void;
};

/**
 * A list of actions to pick one from: a tile per option. Under 768px a sheet; from 768px a popover.
 */
export function ActionPicker<T extends string>({
  trigger,
  title,
  subtitle,
  options,
  onPick,
}: ActionPickerProps<T>) {
  const sheet = useWindowNarrowerThan(768);
  const [open, setOpen] = useState(false);
  const tiles = (
    <ul className="flex flex-col gap-2">
      {options.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onPick(option.value);
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-3 text-left hover:bg-muted"
          >
            <AccentIcon name={option.icon} size={20} compact />
            <span className="min-w-0 flex-1 text-body-strong text-foreground">{option.label}</span>
            <Icon name="chevron_right_rounded" size={20} className="text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );

  if (sheet) {
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
      <PopoverContent align="end" className="flex w-80 flex-col">
        <p className="text-heading text-foreground">{title}</p>
        <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>
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
      <DialogContent aria-describedby={undefined} className="max-w-[720px]">
        <DialogTitle className="mb-4">{props.labels.title}</DialogTitle>
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
        <Icon name="arrow_forward_rounded" size={20} className="mx-2 text-muted-foreground" />
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
      <div className="mt-4 rounded-lg border border-border bg-card p-3">
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
          <p className="flex-1 text-center text-body-strong text-foreground">
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
            root: 'relative mt-2 w-full text-foreground',
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
        'flex min-w-0 flex-1 cursor-pointer flex-col items-start rounded-md bg-card p-3 text-left hover:bg-muted',
        active ? 'border border-foreground' : 'border border-border',
      )}
    >
      <span className={cn('text-caption', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span className="mt-1 w-full truncate text-body-strong text-foreground">{value}</span>
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
        'inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-label hover:bg-muted',
        muted ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      {label}
    </button>
  );
}
