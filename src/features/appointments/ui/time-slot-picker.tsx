import { useIntl } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import { formatDay, type DateLocale } from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';
import { DateInputField, EmptyState, FormField, Input, Spinner, type DateInputLabels } from '@/shared/ui';

import type { TimeSlot } from '../model/appointment';

type TimeSlotPickerProps = {
  day: string;
  time: string;
  durationMinutes: number;
  availableDates: readonly string[];
  slots: readonly TimeSlot[];
  datesLoading: boolean;
  slotsLoading: boolean;
  emptyDatesMessage: string;
  onDayChange: (day: string) => void;
  onTimeChange: (time: string) => void;
  showDuration?: boolean;
  showProposal?: boolean;
};

/**
 * AdminTimeSlotPicker: date from the available days, then clock slots as chips, with optional
 * duration and proposal summary.
 */
export function TimeSlotPicker({
  day,
  time,
  durationMinutes,
  availableDates,
  slots,
  datesLoading,
  slotsLoading,
  emptyDatesMessage,
  onDayChange,
  onTimeChange,
  showDuration = true,
  showProposal = true,
}: TimeSlotPickerProps) {
  const intl = useIntl();
  const locale = intl.locale as DateLocale;
  const text = (id: MessageId) => intl.formatMessage({ id });

  if (datesLoading && availableDates.length === 0) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size={28} className="text-primary" />
      </div>
    );
  }
  if (availableDates.length === 0) {
    return <EmptyState icon="event_outlined" title={emptyDatesMessage} message={emptyDatesMessage} />;
  }

  const sorted = [...availableDates].sort();
  const first = sorted.at(0) ?? '';
  const last = sorted.at(-1) ?? first;
  const selectedDay = day || first;
  const dateLabels: DateInputLabels = {
    title: text('appointmentFieldDate'),
    subtitle: text('appointmentDateFilterSubtitle'),
    apply: text('adminCommonApply'),
    cancel: text('adminCommonCancel'),
  };

  const selectedSlot = slots.find((slot) => slot.time === time);
  const dateSummary = day ? formatDay(day, locale, 'longDate') : '';
  let proposal: string | null = null;
  if (showProposal && day) {
    if (slots.length === 0) {
      proposal = intl.formatMessage({ id: 'appointmentSlotProposalNoSlots' }, { dateSummary });
    } else if (time && selectedSlot) {
      proposal = selectedSlot.isAvailable
        ? intl.formatMessage({ id: 'appointmentSlotProposalAvailable' }, { dateSummary, slotLabel: time })
        : intl.formatMessage({ id: 'appointmentSlotProposalOccupied' }, { dateSummary, slotLabel: time });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField id="appointment-day" label={text('appointmentFieldDate')}>
        <DateInputField
          id="appointment-day"
          value={day || null}
          onChange={onDayChange}
          placeholder={text('appointmentFieldDate')}
          initialDay={selectedDay}
          first={first}
          last={last}
          language={locale}
          labels={dateLabels}
        />
      </FormField>
      {showDuration && (
        <FormField id="appointment-duration" label={text('appointmentFormDurationMinutesLabel')}>
          <Input
            id="appointment-duration"
            readOnly
            value={
              durationMinutes > 0
                ? intl.formatMessage({ id: 'appointmentDurationMinutesShort' }, { minutes: durationMinutes })
                : text('appointmentFormDurationHint')
            }
            placeholder={text('appointmentFormDurationMinutesLabel')}
          />
        </FormField>
      )}
      <div>
        <p className="mb-2 text-label text-muted-foreground">{text('appointmentFieldTime')}</p>
        {slotsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size={24} className="text-primary" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground">{text('appointmentFormNoSlotsDay')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label={text('appointmentFieldTime')}>
            {slots.map((slot) => {
              const selected = slot.time === time;
              return (
                <li key={slot.time}>
                  <button
                    type="button"
                    disabled={!slot.isAvailable}
                    aria-pressed={selected}
                    onClick={() => {
                      onTimeChange(slot.time);
                    }}
                    className={cn(
                      'h-10 min-w-16 rounded-md border px-3 text-body-strong',
                      selected && 'border-primary bg-primary text-primary-foreground',
                      !selected &&
                        slot.isAvailable &&
                        'border-border bg-card text-foreground hover:bg-foreground/4',
                      !slot.isAvailable &&
                        'cursor-not-allowed border-border/60 bg-card text-muted-foreground/50 line-through',
                    )}
                  >
                    {slot.time}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {proposal && <p className="text-label text-muted-foreground">{proposal}</p>}
    </div>
  );
}
