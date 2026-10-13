import { useState } from 'react';

import { compareDays, dateToDay, dayToDate, formatDay, type BusinessDay } from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { Button } from '../primitives/button';
import { Calendar, type CalendarLocale } from '../primitives/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '../primitives/dialog';
import { fieldBase } from '../primitives/field-styles';

export type DateInputLabels = { title: string; subtitle: string; apply: string; cancel: string };

type DateInputFieldProps = {
  id: string;
  value: BusinessDay | null;
  onChange: (day: BusinessDay) => void;
  placeholder: string;
  /** The day the calendar opens on without a value. */
  initialDay: BusinessDay;
  /** The first and last days the calendar offers. */
  first: BusinessDay;
  last: BusinessDay;
  language: CalendarLocale;
  labels: DateInputLabels;
  invalid?: boolean;
  describedBy?: string;
};

const clamp = (day: BusinessDay, first: BusinessDay, last: BusinessDay) =>
  compareDays(day, first) < 0 ? first : compareDays(day, last) > 0 ? last : day;

/**
 * AdminDateInputField: a read-only field with the day as "dd/mm/yyyy" and a calendar icon; a tap
 * opens a dialog with the month calendar, then apply or cancel.
 */
export function DateInputField({
  id,
  value,
  onChange,
  placeholder,
  initialDay,
  first,
  last,
  language,
  labels,
  invalid = false,
  describedBy,
}: DateInputFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        id={id}
        type="button"
        aria-describedby={describedBy}
        onClick={() => {
          setOpen(true);
        }}
        className={cn(
          fieldBase,
          'flex cursor-pointer items-center pr-4 text-left',
          invalid && 'border-destructive',
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !value && 'text-muted-foreground')}>
          {value ? formatDay(value, language, 'numericDate') : placeholder}
        </span>
        <Icon name="calendar_today_outlined" size={20} className="ml-2 text-muted-foreground" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <DateInputContent
            day={clamp(value ?? initialDay, first, last)}
            first={first}
            last={last}
            language={language}
            labels={labels}
            onCancel={() => {
              setOpen(false);
            }}
            onApply={(day) => {
              setOpen(false);
              onChange(day);
            }}
          />
        )}
      </Dialog>
    </>
  );
}

type ContentProps = {
  day: BusinessDay;
  first: BusinessDay;
  last: BusinessDay;
  language: CalendarLocale;
  labels: DateInputLabels;
  onCancel: () => void;
  onApply: (day: BusinessDay) => void;
};

function DateInputContent({ day, first, last, language, labels, onCancel, onApply }: ContentProps) {
  const [selected, setSelected] = useState(day);
  const [month, setMonth] = useState(() => dayToDate(day));

  return (
    <DialogContent>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogDescription className="mt-2">{labels.subtitle}</DialogDescription>
      <div className="mt-5 rounded-lg border border-border bg-card p-3">
        <Calendar
          mode="single"
          language={language}
          required
          selected={dayToDate(selected)}
          onSelect={(value) => {
            setSelected(dateToDay(value));
          }}
          month={month}
          onMonthChange={setMonth}
          startMonth={dayToDate(first)}
          endMonth={dayToDate(last)}
          disabled={[{ before: dayToDate(first) }, { after: dayToDate(last) }]}
        />
      </div>
      <DialogFooter>
        <Button variant="secondary" icon="close" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button
          icon="check_rounded"
          onClick={() => {
            onApply(selected);
          }}
        >
          {labels.apply}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
