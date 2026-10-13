import { useId, useState } from 'react';

import { clockTimeOf, minutesOfDay, parseClockTime, type ClockTime } from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { Button } from '../primitives/button';
import type { CalendarLocale } from '../primitives/calendar';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '../primitives/dialog';
import { fieldBase } from '../primitives/field-styles';
import { Input } from '../primitives/input';

export type TimePickerLabels = {
  /** The dialog's help text, such as "Select the start time". */
  help: string;
  cancel: string;
  confirm: string;
  hour: string;
  minute: string;
  /** Kept so current screens still type-check. The picker has no dial or input-mode toggle. */
  inputMode: string;
  dialMode: string;
  invalid: string;
  am: string;
  pm: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

/** Placeholder for a field without a time. */
const NO_TIME = '--:--';

/**
 * Spanish `H:mm`, Catalan `HH:mm`, English `h:mm a`. The stored value stays `HH:mm`.
 */
function formatTime(time: ClockTime, language: CalendarLocale, labels: TimePickerLabels): string {
  const total = minutesOfDay(time);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  if (language === 'en') {
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${pad(minute)} ${hour >= 12 ? labels.pm : labels.am}`;
  }
  if (language === 'ca') return `${pad(hour)}:${pad(minute)}`;
  return `${hour}:${pad(minute)}`;
}

/** A clock time from the field, or null when the text is not one in that locale's format. */
function parseTime(text: string, language: CalendarLocale, labels: TimePickerLabels): ClockTime | null {
  const trimmed = text.trim();
  if (language !== 'en') return parseClockTime(trimmed);
  const match = /^(\d{1,2}):(\d{1,2})\s+(\S(?:.*\S)?)$/.exec(trimmed);
  if (!match) return null;
  const hour12 = Number(match[1]);
  const minute = Number(match[2]);
  const periodText = match[3];
  if (periodText === undefined) return null;
  const period = periodText.toLowerCase();
  const am = labels.am.trim().toLowerCase();
  const pm = labels.pm.trim().toLowerCase();
  if (hour12 < 1 || hour12 > 12 || minute > 59) return null;
  if (period !== am && period !== pm) return null;
  return clockTimeOf((hour12 % 12) * 60 + (period === pm ? 12 * 60 : 0) + minute);
}

/** Quarter hours of the anchor hour. A shortcut: any minute the field can parse is still valid. */
function quarterOptions(anchor: ClockTime, language: CalendarLocale, labels: TimePickerLabels): string[] {
  const hour = Math.floor(minutesOfDay(anchor) / 60);
  return [0, 15, 30, 45].map((minute) => formatTime(clockTimeOf(hour * 60 + minute), language, labels));
}

type TimePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The time it opens on. */
  initial: ClockTime;
  language: CalendarLocale;
  labels: TimePickerLabels;
  onConfirm: (time: ClockTime) => void;
};

/**
 * A text field plus the quarter hours of that hour. Confirm returns a `ClockTime`. Any minute
 * the field can parse is valid.
 */
export function TimePickerDialog({ open, onOpenChange, ...props }: TimePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The content mounts on each opening, so it starts from `initial`. */}
      {open && (
        <TimePickerContent
          {...props}
          onCancel={() => {
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}

type ContentProps = Omit<TimePickerDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void };

function TimePickerContent({ initial, language, labels, onConfirm, onCancel }: ContentProps) {
  const fieldId = useId();
  const errorId = useId();
  const [text, setText] = useState(() => formatTime(initial, language, labels));
  const [invalid, setInvalid] = useState(false);
  const parsed = parseTime(text, language, labels);
  const quarters = quarterOptions(parsed ?? initial, language, labels);

  const confirm = () => {
    const next = parseTime(text, language, labels);
    if (!next) {
      setInvalid(true);
      return;
    }
    onConfirm(next);
  };

  return (
    <DialogContent aria-describedby={undefined}>
      <DialogTitle>{labels.help}</DialogTitle>
      <div className="mt-4">
        <label htmlFor={fieldId} className="mb-2 block text-label text-foreground">
          {labels.hour}
        </label>
        <Input
          id={fieldId}
          value={text}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(event) => {
            setText(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') confirm();
          }}
        />
        {invalid && (
          <p id={errorId} className="mt-1.5 text-caption text-destructive">
            {labels.invalid}
          </p>
        )}
      </div>
      <div role="group" aria-label={labels.minute} className="mt-3 flex flex-col">
        {quarters.map((option) => {
          const selected = option === text;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setText(option);
                setInvalid(false);
              }}
              className={cn(
                'flex h-control cursor-pointer items-center rounded-md px-3 text-left text-body',
                selected ? 'bg-selection-wash text-selection' : 'text-foreground hover:bg-muted',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button onClick={confirm}>{labels.confirm}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

type TimePickerFieldProps = {
  id: string;
  label: string;
  value: ClockTime | null;
  onChange: (time: ClockTime) => void;
  /** The dialog opens here when there is no value yet. */
  initialTime: ClockTime;
  language: CalendarLocale;
  labels: TimePickerLabels;
  enabled?: boolean;
  error?: string;
};

/**
 * Label, then a field with the time (`HH:mm`, or `--:--`) and a clock icon. A tap opens the picker.
 */
export function TimePickerField({
  id,
  label,
  value,
  onChange,
  initialTime,
  language,
  labels,
  enabled = true,
  error,
}: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-2 block text-label text-foreground">
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={!enabled}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => {
          setOpen(true);
        }}
        className={cn(
          fieldBase,
          'flex h-control items-center text-left',
          enabled && 'cursor-pointer',
          error && 'border-destructive',
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !value && 'text-muted-foreground')}>
          {value ?? NO_TIME}
        </span>
        <Icon name="schedule_rounded" size={20} className="ml-2 text-muted-foreground" />
      </button>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-destructive">
          {error}
        </p>
      )}
      <TimePickerDialog
        open={open}
        onOpenChange={setOpen}
        initial={value ?? initialTime}
        language={language}
        labels={labels}
        onConfirm={(time) => {
          setOpen(false);
          onChange(time);
        }}
      />
    </div>
  );
}
