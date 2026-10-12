import { useIntl } from 'react-intl';

import { useLocaleStore, type MessageId } from '@/shared/i18n';
import { businessDayOf, clockTimeOfInstant, formatClockTime, formatDay } from '@/shared/lib/business-time';
import {
  Button,
  DetailRow,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui';

import {
  clientName,
  datesLabel,
  holdClock,
  isHeld,
  isUpgrade,
  serviceName,
  shortDateTime,
  timeWindow,
  windowClock,
  type SlotWatch,
} from '../model/slot-watch';
import { SlotWatchStatus } from './slot-watches-rows';

type SlotWatchDetailSheetProps = {
  watch: SlotWatch | null;
  onOpenChange: (open: boolean) => void;
  onClient: (watch: SlotWatch) => void;
  onAppointment: (watch: SlotWatch) => void;
  onCancel: (watch: SlotWatch) => void;
};

/** The watch detail (showSlotWatchDetailSheet): the fields, then client, appointment, and cancel. */
export function SlotWatchDetailSheet({
  watch,
  onOpenChange,
  onClient,
  onAppointment,
  onCancel,
}: SlotWatchDetailSheetProps) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const text = (id: MessageId) => intl.formatMessage({ id });

  return (
    <Sheet
      open={watch !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent>
        {watch && (
          <SheetBody>
            <SheetHeader>
              <SheetTitle>{clientName(watch)}</SheetTitle>
              <SheetDescription>{text('slotWatchAdminDetailTitle')}</SheetDescription>
            </SheetHeader>
            <SlotWatchStatus watch={watch} />
            <dl className="mt-4 flex flex-col gap-3">
              {watch.userEmail && (
                <DetailRow label={text('slotWatchAdminDetailEmail')} value={watch.userEmail} />
              )}
              <DetailRow label={text('slotWatchAdminColumnService')} value={serviceName(watch)} />
              <DetailRow label={text('slotWatchAdminDetailDates')} value={datesLabel(watch.dates, locale)} />
              <DetailRow
                label={text('slotWatchAdminDetailTimeWindow')}
                value={windowLabel(watch, text('slotWatchAdminAnyTime'), locale)}
              />
              {watch.preferredStart && (
                <DetailRow
                  label={text('slotWatchAdminDetailPreferredStart')}
                  value={shortDateTime(watch.preferredStart, locale)}
                />
              )}
              {isUpgrade(watch) && (
                <DetailRow
                  label={text('slotWatchAdminDetailLinkedAppointment')}
                  value={
                    watch.linkedAppointmentStart
                      ? fullDateTime(watch.linkedAppointmentStart, locale)
                      : text('slotWatchAdminUpgrade')
                  }
                />
              )}
              {isHeld(watch) && watch.heldSlotStart && (
                <DetailRow
                  label={text('slotWatchAdminDetailHeldSlot')}
                  value={heldValue(watch, locale, (time) =>
                    intl.formatMessage({ id: 'slotWatchAdminHoldUntil' }, { time }),
                  )}
                />
              )}
              <DetailRow label={text('slotWatchAdminDetailNotifyCount')} value={String(watch.notifyCount)} />
              <DetailRow
                label={text('slotWatchAdminDetailCreatedAt')}
                value={shortDateTime(watch.createdAt, locale)}
              />
              <DetailRow
                label={text('slotWatchAdminDetailExpiresAt')}
                value={fullDate(watch.expiresAt, locale)}
              />
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              {watch.userId && (
                <Button
                  variant="secondary"
                  icon="person_outline"
                  onClick={() => {
                    onClient(watch);
                  }}
                >
                  {text('slotWatchAdminViewClient')}
                </Button>
              )}
              {isUpgrade(watch) && (
                <Button
                  variant="secondary"
                  icon="event_outlined"
                  onClick={() => {
                    onAppointment(watch);
                  }}
                >
                  {text('slotWatchAdminViewAppointment')}
                </Button>
              )}
              <Button
                variant="danger"
                icon="notifications_off_outlined"
                onClick={() => {
                  onCancel(watch);
                }}
              >
                {text('slotWatchAdminCancelConfirm')}
              </Button>
            </div>
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}

function windowLabel(watch: SlotWatch, anyTime: string, locale: Parameters<typeof windowClock>[1]): string {
  const window = timeWindow(watch);
  switch (window.kind) {
    case 'any':
      return anyTime;
    case 'range':
      return `${windowClock(window.from, locale)}–${windowClock(window.to, locale)}`;
    case 'from':
      return `${windowClock(window.from, locale)}+`;
    case 'until':
      return `–${windowClock(window.to, locale)}`;
  }
}

/** `dd/MM/yyyy` of the salon day (slotWatchFullDate). */
function fullDate(instant: string, locale: Parameters<typeof formatDay>[1]): string {
  const day = businessDayOf(instant);
  return day ? formatDay(day, locale, 'numericDate') : '—';
}

/** `dd/MM/yyyy HH:mm` (slotWatchFullDate + slotWatchClock). */
function fullDateTime(instant: string, locale: Parameters<typeof formatDay>[1]): string {
  const day = businessDayOf(instant);
  const time = clockTimeOfInstant(instant);
  if (!day || !time) return '—';
  return `${formatDay(day, locale, 'numericDate')} ${formatClockTime(time, locale, 'HH:mm')}`;
}

function heldValue(
  watch: SlotWatch,
  locale: Parameters<typeof formatDay>[1],
  holdUntil: (time: string) => string,
): string {
  const start = watch.heldSlotStart ? shortDateTime(watch.heldSlotStart, locale) : '—';
  const clock = holdClock(watch);
  if (!clock) return start;
  return `${start} · ${holdUntil(formatClockTime(clock, locale, 'HH:mm'))}`;
}
