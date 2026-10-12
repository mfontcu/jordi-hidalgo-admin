import { useId, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import type { ClockTime } from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  TimePickerField,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useWindowNarrowerThan,
} from '@/shared/ui';

import { useShiftEditor } from '../../hooks/use-working-hours';
import { shiftRange, type ShiftErrors, type ShiftSlot, type WorkingDay } from '../../model/working-hours';
import { localeOf, textOf, timePickerLabels } from '../shared/labels';

/** Flutter's sheet opens with nothing focused; Radix would focus the close button and its tooltip. */
const keepFocus = (event: Event) => {
  event.preventDefault();
};

type ShiftEditorProps = {
  day: WorkingDay;
  slot: ShiftSlot;
  /** A sheet from the bottom on compact layouts, a panel under the edit button otherwise. */
  compact: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  onSave: (start: ClockTime, end: ClockTime) => void;
  onDelete: () => void;
};

/**
 * `_EditTimeRangeSheet`: the shift's start and end, then save, delete, or cancel. Flutter opens a
 * bottom sheet at every width; on wide layouts this opens a panel under the edit button, as the
 * list filters do (approved change).
 */
export function ShiftEditor({
  day,
  slot,
  compact,
  open,
  onOpenChange,
  trigger,
  onSave,
  onDelete,
}: ShiftEditorProps) {
  // The content mounts on each opening, so it starts from the stored shift.
  const content = open && (
    <EditorContent
      inSheet={compact}
      day={day}
      slot={slot}
      onSave={onSave}
      onDelete={onDelete}
      onCancel={() => {
        onOpenChange(false);
      }}
    />
  );

  if (compact) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          aria-describedby={undefined}
          onOpenAutoFocus={keepFocus}
          overlayClassName="bg-black/45"
          className="rounded-t-[22px] min-[640px]:max-w-[540px]"
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[540px] max-w-[calc(100vw-48px)] p-0"
        onOpenAutoFocus={keepFocus}
        // The time picker opens a dialog over the panel; using it does not close the panel.
        onInteractOutside={(event) => {
          if (event.target instanceof Element && event.target.closest('[role="dialog"]'))
            event.preventDefault();
        }}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

const hintClass = 'mt-2 text-[13px] leading-[1.45] text-content-secondary';

type ContentProps = {
  /** In the sheet, the title and hint name the dialog; in the panel they are plain text. */
  inSheet: boolean;
  day: WorkingDay;
  slot: ShiftSlot;
  onSave: (start: ClockTime, end: ClockTime) => void;
  onDelete: () => void;
  onCancel: () => void;
};

function EditorContent({ inSheet, day, slot, onSave, onDelete, onCancel }: ContentProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const id = useId();
  const editor = useShiftEditor(day, slot);
  const narrow = useWindowNarrowerThan(620);
  const title = text(slot === 'morning' ? 'scheduleMorningShiftTitle' : 'scheduleAfternoonShiftTitle');

  const errorText = (field: 'start' | 'end', errors: ShiftErrors) => {
    const key = errors[field];
    if (!key) return undefined;
    if (key === 'overlap') {
      return intl.formatMessage(
        { id: 'scheduleValidationShiftOverlap' },
        { range: errors.overlapping ? shiftRange(errors.overlapping) : '' },
      );
    }
    return text(key === 'required' ? 'scheduleValidationRequired' : 'scheduleValidationEndAfterStart');
  };

  const fields = [
    <TimePickerField
      key="start"
      id={`${id}-start`}
      label={text('scheduleTimeStart')}
      value={editor.start}
      onChange={editor.setStart}
      initialTime="09:00"
      language={localeOf(intl)}
      labels={timePickerLabels(intl, 'scheduleTimePickerSelectStart')}
      error={errorText('start', editor.errors)}
    />,
    <TimePickerField
      key="end"
      id={`${id}-end`}
      label={text('scheduleTimeEnd')}
      value={editor.end}
      onChange={editor.setEnd}
      initialTime="11:00"
      language={localeOf(intl)}
      labels={timePickerLabels(intl, 'scheduleTimePickerSelectEnd')}
      error={errorText('end', editor.errors)}
    />,
  ];

  const save = (
    <Button
      icon="save_outlined"
      onClick={() => {
        const times = editor.validate();
        if (times) onSave(times.start, times.end);
      }}
    >
      {text('scheduleSaveShift')}
    </Button>
  );
  const remove = (
    <Button variant="secondary" icon="delete_outline" onClick={onDelete}>
      {text('scheduleDeleteShift')}
    </Button>
  );

  return (
    <div className={cn('flex flex-col px-[22px] pb-[22px]', inSheet ? 'pt-1' : 'pt-[22px]')}>
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          {inSheet ? (
            <SheetTitle className="text-[22px] font-black">{title}</SheetTitle>
          ) : (
            <h2 className="text-[22px] font-black text-on-surface">{title}</h2>
          )}
          <p className="mt-1.5 text-[14px] font-bold text-accent-fg">{day.label}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="icon" aria-label={text('scheduleCloseTooltip')} onClick={onCancel}>
              <Icon name="close_rounded" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{text('scheduleCloseTooltip')}</TooltipContent>
        </Tooltip>
      </div>
      {inSheet ? (
        <SheetDescription className={hintClass}>{text('scheduleEditTimeRangeHint')}</SheetDescription>
      ) : (
        <p className={hintClass}>{text('scheduleEditTimeRangeHint')}</p>
      )}
      <div className={narrow ? 'mt-5 flex flex-col gap-4' : 'mt-5 grid grid-cols-2 gap-3'}>{fields}</div>
      <div className={narrow ? 'mt-6 flex flex-col gap-3' : 'mt-6 flex gap-3 [&>*]:flex-1'}>
        {save}
        {remove}
      </div>
      <Button variant="text" icon="arrow_back_rounded" onClick={onCancel} className="mt-3 w-full">
        {text('adminCommonCancel')}
      </Button>
    </div>
  );
}
