import { useId, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from 'react';

import { clockTimeOf, minutesOfDay, type ClockTime } from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import { Button } from '../primitives/button';
import type { CalendarLocale } from '../primitives/calendar';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../primitives/tooltip';

export type TimePickerLabels = {
  /** The dialog's help text (`helpText`, such as "Select the start time"). */
  help: string;
  cancel: string;
  confirm: string;
  hour: string;
  minute: string;
  /** Tooltips of the entry-mode button (inputTimeModeButtonLabel, dialModeButtonLabel). */
  inputMode: string;
  dialMode: string;
  invalid: string;
  am: string;
  pm: string;
};

/**
 * The hour as MaterialLocalizations formats it (timeOfDayFormat): Spanish `H:mm` ("9"), Catalan
 * `HH:mm` ("09"), English `h:mm a` (a 12-hour dial with AM and PM).
 */
type HourFormat = 'H' | 'HH' | 'h';
const HOUR_FORMATS: Record<CalendarLocale, HourFormat> = { es: 'H', ca: 'HH', en: 'h' };

const pad = (value: number) => String(value).padStart(2, '0');

/** The time separator of every locale (TimeOfDayFormat `HH:mm`, `H:mm`, `h:mm a`). */
const TIME_SEPARATOR = ':';
/** formatAdminTimeOfDay's placeholder for a field without a time. */
const NO_TIME = '--:--';

function hourLabel(hour: number, format: HourFormat): string {
  if (format === 'h') return String(hour % 12 === 0 ? 12 : hour % 12);
  return format === 'HH' ? pad(hour) : String(hour);
}

/** Whether the main pointer is a mouse or a trackpad (a desktop browser). */
function useFinePointer(): boolean {
  return useMediaQuery('(pointer: fine)');
}

function useMediaQuery(query: string): boolean {
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
 * showTimePicker (Material 3): the hour and minute over a dial, or two fields in input mode, with
 * cancel and confirm. Landscape windows put the dial beside the time. Flutter always opens on the
 * dial; with a mouse this opens on the fields, which are quicker to type in (approved change).
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
  const format = HOUR_FORMATS[language];
  const finePointer = useFinePointer();
  const landscape = useMediaQuery('(orientation: landscape)');
  const [mode, setMode] = useState<'dial' | 'input'>(finePointer ? 'input' : 'dial');
  const [selecting, setSelecting] = useState<'hour' | 'minute'>('hour');
  const [minutes, setMinutes] = useState(() => minutesOfDay(initial));
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  const [hourText, setHourText] = useState(() => hourLabel(hour, format));
  const [minuteText, setMinuteText] = useState(() => pad(minute));
  const [invalid, setInvalid] = useState(false);

  const setTime = (nextHour: number, nextMinute: number) => {
    setMinutes(nextHour * 60 + nextMinute);
  };

  /** Input mode: the typed hour and minute, or null when they are not a time. */
  const typedTime = (): number | null => {
    const h = /^\d{1,2}$/.test(hourText.trim()) ? Number(hourText) : NaN;
    const m = /^\d{1,2}$/.test(minuteText.trim()) ? Number(minuteText) : NaN;
    if (Number.isNaN(h) || Number.isNaN(m) || m > 59) return null;
    if (format === 'h') {
      if (h < 1 || h > 12) return null;
      return ((h % 12) + (hour >= 12 ? 12 : 0)) * 60 + m;
    }
    return h > 23 ? null : h * 60 + m;
  };

  const switchMode = () => {
    if (mode === 'input') {
      const typed = typedTime();
      if (typed !== null) setMinutes(typed);
      setInvalid(false);
      setMode('dial');
    } else {
      setHourText(hourLabel(hour, format));
      setMinuteText(pad(minute));
      setMode('input');
    }
  };

  const confirm = () => {
    if (mode === 'input') {
      const typed = typedTime();
      if (typed === null) {
        setInvalid(true);
        return;
      }
      onConfirm(clockTimeOf(typed));
      return;
    }
    onConfirm(clockTimeOf(minutes));
  };

  const setPeriod = (pm: boolean) => {
    if (pm !== hour >= 12) setTime(pm ? hour + 12 : hour - 12, minute);
  };
  const period = format === 'h' && (
    <PeriodToggle
      pm={hour >= 12}
      labels={labels}
      onChange={setPeriod}
      horizontal={mode === 'dial' && landscape}
    />
  );

  const actions = (
    <div className="flex h-10 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="icon"
            aria-label={mode === 'dial' ? labels.inputMode : labels.dialMode}
            onClick={switchMode}
          >
            <Icon name={mode === 'dial' ? 'keyboard_outlined' : 'access_time'} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{mode === 'dial' ? labels.inputMode : labels.dialMode}</TooltipContent>
      </Tooltip>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="text" onClick={onCancel} className="font-medium">
          {labels.cancel}
        </Button>
        <Button variant="text" onClick={confirm} className="font-medium">
          {labels.confirm}
        </Button>
      </div>
    </div>
  );

  const help = (
    <DialogTitle className="text-body-md font-normal text-on-surface-secondary">{labels.help}</DialogTitle>
  );

  if (mode === 'input') {
    return (
      <DialogContent
        aria-describedby={undefined}
        // Flutter's picker opens with no field focused; Radix would focus the hour.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        className="w-[296px] max-w-[calc(100vw-48px)] gap-0 rounded-[28px] bg-surface-container-high p-6 pb-6"
      >
        <div className="flex h-5 items-center">{help}</div>
        <div className="mt-5 flex items-start">
          <InputBox
            label={labels.hour}
            value={hourText}
            onChange={(text) => {
              setHourText(text);
              setInvalid(false);
            }}
            invalid={invalid}
          />
          <Separator className="h-[72px] w-6 text-display-lg" />
          <InputBox
            label={labels.minute}
            value={minuteText}
            onChange={(text) => {
              setMinuteText(text);
              setInvalid(false);
            }}
            invalid={invalid}
            onEnter={confirm}
          />
          {period && <div className="ml-3">{period}</div>}
        </div>
        {invalid && <p className="mt-1 text-body-sm text-error">{labels.invalid}</p>}
        <div className="mt-[34px]">{actions}</div>
      </DialogContent>
    );
  }

  const time = (
    <div className="flex items-start">
      <TimeBox
        label={labels.hour}
        text={hourLabel(hour, format)}
        active={selecting === 'hour'}
        onClick={() => {
          setSelecting('hour');
        }}
        className={landscape ? 'w-24' : 'flex-1'}
      />
      <Separator className="h-20 w-6 text-display-lg" />
      <TimeBox
        label={labels.minute}
        text={pad(minute)}
        active={selecting === 'minute'}
        onClick={() => {
          setSelecting('minute');
        }}
        className={landscape ? 'w-24' : 'flex-1'}
      />
      {period && !landscape && <div className="ml-3">{period}</div>}
    </div>
  );
  const dial = (
    <Dial
      size={landscape ? 244 : 256}
      selecting={selecting}
      minutes={minutes}
      format={format}
      label={selecting === 'hour' ? labels.hour : labels.minute}
      onChange={setMinutes}
      onHourPicked={() => {
        setSelecting('minute');
      }}
    />
  );

  if (landscape) {
    return (
      <DialogContent
        aria-describedby={undefined}
        className="w-[572px] max-w-[calc(100vw-48px)] gap-0 rounded-[28px] bg-surface-container-high p-6"
      >
        <div className="relative flex">
          <div className="flex w-[216px] shrink-0 flex-col">
            <div className="flex h-5 items-center">{help}</div>
            <div className="mt-[85px]">{time}</div>
            {period && <div className="mt-3">{period}</div>}
          </div>
          <div className="ml-16 pt-[23px]">{dial}</div>
        </div>
        <div className="mt-[23px]">{actions}</div>
      </DialogContent>
    );
  }

  return (
    <DialogContent
      aria-describedby={undefined}
      className="w-[358px] max-w-[calc(100vw-32px)] gap-0 rounded-[28px] bg-surface-container-high p-6"
    >
      <div className="flex h-5 items-center">{help}</div>
      <div className="mt-3">{time}</div>
      <div className="mt-[38px] flex justify-center">{dial}</div>
      <div className="mt-2.5">{actions}</div>
    </DialogContent>
  );
}

function Separator({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center text-on-surface', className)}>
      {TIME_SEPARATOR}
    </span>
  );
}

type TimeBoxProps = {
  label: string;
  text: string;
  active: boolean;
  onClick: () => void;
  className?: string;
};

/** `_HourControl`, `_MinuteControl`: the hour or minute; the one the dial edits is highlighted. */
function TimeBox({ label, text, active, onClick, className }: TimeBoxProps) {
  return (
    <button
      type="button"
      aria-label={`${label} ${text}`}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-20 cursor-pointer items-center justify-center rounded-xs text-display-lg',
        active
          ? 'bg-primary-container text-on-primary-container'
          : 'bg-surface-container-highest text-on-surface hover:bg-[color-mix(in_srgb,var(--on-surface)_8%,var(--surface-container-highest))]',
        className,
      )}
    >
      {text}
    </button>
  );
}

type InputBoxProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  invalid: boolean;
  onEnter?: () => void;
};

/** `_HourMinuteTextField`: two digits over the field's label. */
function InputBox({ label, value, onChange, invalid, onEnter }: InputBoxProps) {
  const id = useId();
  return (
    <div className="flex w-28 flex-col">
      <input
        id={id}
        inputMode="numeric"
        maxLength={2}
        value={value}
        onChange={(event) => {
          onChange(event.target.value.replace(/\D/g, ''));
        }}
        onFocus={(event) => {
          event.target.select();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onEnter?.();
        }}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-[72px] w-full rounded-xs border-2 border-transparent bg-surface-container-highest text-center text-display-md text-on-surface outline-none',
          'focus:border-primary focus:bg-primary-container focus:text-on-primary-container',
          invalid && 'border-error focus:border-error',
        )}
      />
      <label htmlFor={id} className="mt-3.5 text-body-sm text-on-surface-muted">
        {label}
      </label>
    </div>
  );
}

type PeriodToggleProps = {
  pm: boolean;
  labels: TimePickerLabels;
  onChange: (pm: boolean) => void;
  horizontal: boolean;
};

/**
 * `_DayPeriodControl` of the 12-hour dial (English): AM over PM, or side by side in landscape.
 * Material fills the chosen period with tertiaryContainer, which the panel's seed leaves close to
 * primaryContainer; the panel uses the latter.
 */
function PeriodToggle({ pm, labels, onChange, horizontal }: PeriodToggleProps) {
  const option = (value: boolean, label: string) => (
    <button
      type="button"
      aria-pressed={pm === value}
      onClick={() => {
        onChange(value);
      }}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-center text-title-md',
        pm === value ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant',
      )}
    >
      {label}
    </button>
  );
  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-xs border border-outline',
        horizontal
          ? 'h-10 w-[216px] flex-row divide-x divide-outline'
          : 'h-20 w-[52px] flex-col divide-y divide-outline',
      )}
    >
      {option(false, labels.am)}
      {option(true, labels.pm)}
    </div>
  );
}

type DialProps = {
  size: number;
  selecting: 'hour' | 'minute';
  minutes: number;
  format: HourFormat;
  label: string;
  onChange: (minutes: number) => void;
  /** A tap or drag on the hours ended: the dial moves on to the minutes, as Flutter's does. */
  onHourPicked: () => void;
};

const SELECTOR = 48;
/** `_labelPadding`: the outer labels sit 28px inside the dial, the inner ones 28px further in. */
const LABEL_PADDING = 28;

/** `_Dial`: the hours (two rings in 24-hour formats) or the minutes, with the hand and selector. */
function Dial({ size, selecting, minutes, format, label, onChange, onHourPicked }: DialProps) {
  const radius = size / 2;
  const outer = radius - LABEL_PADDING;
  const inner = radius - LABEL_PADDING * 2;
  const twoRings = format !== 'h';
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const [dragging, setDragging] = useState(false);

  const labels =
    selecting === 'hour'
      ? Array.from({ length: twoRings ? 24 : 12 }, (_, index) => {
          // 24-hour dials: 0–11 outside, 12–23 inside; 12-hour dials: 12, 1, … 11.
          const value = twoRings ? index : index === 0 ? 12 : index;
          const ring = twoRings && index >= 12 ? inner : outer;
          return {
            key: index,
            angle: ((index % 12) / 12) * 2 * Math.PI,
            ring,
            text: hourLabel(value, format),
          };
        })
      : Array.from({ length: 12 }, (_, index) => ({
          key: index,
          angle: (index / 12) * 2 * Math.PI,
          ring: outer,
          text: pad(index * 5),
        }));

  const selectedAngle = selecting === 'hour' ? ((hour % 12) / 12) * 2 * Math.PI : (minute / 60) * 2 * Math.PI;
  const selectedRing = selecting === 'hour' && twoRings && hour >= 12 ? inner : outer;
  const selectedText = selecting === 'hour' ? hourLabel(hour, format) : minute % 5 === 0 ? pad(minute) : null;

  const at = (angle: number, ring: number) => ({
    left: radius + ring * Math.sin(angle),
    top: radius - ring * Math.cos(angle),
  });

  const pick = (event: PointerEvent<HTMLDivElement>, snapMinutes: number) => {
    const box = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - box.left - radius;
    const dy = event.clientY - box.top - radius;
    const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);
    if (selecting === 'hour') {
      const index = Math.round((angle / (2 * Math.PI)) * 12) % 12;
      let next: number;
      if (twoRings) {
        next = Math.hypot(dx, dy) < (outer + inner) / 2 ? index + 12 : index;
      } else {
        next = index + (hour >= 12 ? 12 : 0);
      }
      onChange(next * 60 + minute);
    } else {
      const steps = 60 / snapMinutes;
      const next = (Math.round((angle / (2 * Math.PI)) * steps) % steps) * snapMinutes;
      onChange(hour * 60 + next);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowUp' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    if (selecting === 'hour') onChange(((((hour + step) % 24) + 24) % 24) * 60 + minute);
    else onChange(hour * 60 + ((((minute + step) % 60) + 60) % 60));
  };

  const selector = at(selectedAngle, selectedRing);
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={selecting === 'hour' ? 23 : 59}
      aria-valuenow={selecting === 'hour' ? hour : minute}
      aria-valuetext={selecting === 'hour' ? hourLabel(hour, format) : pad(minute)}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        // A tap picks the minute nearest a label, a drag any minute (Flutter's _Dial).
        pick(event, 5);
      }}
      onPointerMove={(event) => {
        if (dragging) pick(event, 1);
      }}
      onPointerUp={() => {
        setDragging(false);
        if (selecting === 'hour') onHourPicked();
      }}
      className="relative shrink-0 cursor-pointer touch-none rounded-pill bg-surface-container-highest outline-none select-none focus-visible:ring-2 focus-visible:ring-focus"
      style={{ width: size, height: size }}
    >
      {labels.map((item) => {
        const { left, top } = at(item.angle, item.ring);
        return (
          <span
            key={item.key}
            aria-hidden
            className="absolute -translate-x-1/2 -translate-y-1/2 text-body-lg tracking-normal text-on-surface"
            style={{ left, top }}
          >
            {item.text}
          </span>
        );
      })}
      {/* The hand, from the center to the selector. */}
      <span
        aria-hidden
        className="absolute h-0.5 origin-left bg-primary"
        style={{
          left: radius,
          top: radius - 1,
          width: selectedRing,
          transform: `rotate(${selectedAngle - Math.PI / 2}rad)`,
        }}
      />
      <span
        aria-hidden
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-primary"
        style={{ left: radius, top: radius }}
      />
      <span
        aria-hidden
        className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-primary text-body-lg font-medium tracking-normal text-on-primary"
        style={{ left: selector.left, top: selector.top, width: SELECTOR, height: SELECTOR }}
      >
        {selectedText ?? <span className="size-1 rounded-pill bg-on-primary" />}
      </span>
    </div>
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
 * AdminTimePickerField: label, then a 20px-radius field with the time ('HH:mm', or '--:--') and a
 * clock icon; a tap opens the time picker. Disabled, it takes the muted surface.
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
      <label htmlFor={id} className="mb-2 font-bold text-on-surface">
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
          'flex w-full items-center rounded-lg border p-4 text-left',
          error ? 'border-danger-accent' : 'border-outline-variant',
          enabled
            ? 'cursor-pointer bg-surface hover:bg-[color-mix(in_srgb,var(--on-surface)_4%,var(--surface))]'
            : 'cursor-default bg-surface-muted',
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 leading-[1.45]',
            value ? 'text-content-secondary' : 'text-content-secondary/72',
          )}
        >
          {value ?? NO_TIME}
        </span>
        <Icon name="schedule_rounded" className="text-content-secondary" />
      </button>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] text-danger-accent">
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
