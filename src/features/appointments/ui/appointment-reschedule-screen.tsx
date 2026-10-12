import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatInstantDateTime, type DateLocale } from '@/shared/lib/business-time';
import {
  Button,
  EmptyState,
  InfoCard,
  LoadingBarrier,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  SummaryCard,
  useElementWidth,
} from '@/shared/ui';

import { useAppointmentReschedule } from '../hooks/use-appointment-reschedule';
import { formatPrice, statusLabelOf } from '../model/appointment';
import { TimeSlotPicker } from './time-slot-picker';

function formLayoutFor(width: number) {
  if (width < 640) return { padding: 16, gap: 20, titleSize: 24, subtitleSize: 14 };
  if (width < 1040) return { padding: 20, gap: 22, titleSize: 28, subtitleSize: 14 };
  return { padding: 24, gap: 24, titleSize: 30, subtitleSize: 15 };
}

/** `/appointments/{id}/reschedule` (AppointmentRescheduleScreen). */
export function AppointmentRescheduleScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);
  const locale = intl.locale as DateLocale;
  const text = (id: MessageId) => intl.formatMessage({ id });

  const reschedule = useAppointmentReschedule({
    onSuccess: () => showToast(text('appointmentStatusUpdatedSnackbar')),
    onError: (error) => showErrorToast(describeFailure(error, 'appointmentRescheduleFailed')),
    onCannotReschedule: () => showErrorToast(text('appointmentCannotRescheduleWithoutClient')),
  });

  const appointment = reschedule.appointment;
  const statusId = appointment ? statusLabelOf(appointment.status) : null;
  const statusLabel = statusId ? text(statusId) : (appointment?.status ?? '');
  const currentWhen = appointment
    ? [appointment.service.name, formatInstantDateTime(appointment.start, locale, 'longDate', 'HH:mm')].join(
        ' · ',
      )
    : '';
  const currentMeta = appointment
    ? [formatPrice(appointment.service.priceCents), statusLabel].join(' · ')
    : '';

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={text('appointmentRescheduleTitle')}
            subtitle={text('appointmentRescheduleSubtitle')}
            titleSize={layout.titleSize}
            subtitleSize={layout.subtitleSize}
            back={{ label: text('appointmentBackToDetail'), onClick: reschedule.goBack }}
          />
          <div style={{ marginTop: width < 700 ? 12 : layout.gap }} className="flex flex-col gap-5">
            {reschedule.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : reschedule.error || !appointment ? (
              <EmptyState
                icon="error_outline"
                title={text('appointmentLoadError')}
                message={describeFailure(reschedule.error)}
                action={{
                  label: text('adminCommonRetry'),
                  icon: 'refresh',
                  onClick: reschedule.retry,
                }}
              />
            ) : (
              <>
                <SummaryCard className="p-5">
                  <p className="text-[14px] font-bold text-content-secondary">
                    {text('appointmentRescheduleSectionCurrent')}
                  </p>
                  <p className="mt-2 text-[28px] leading-[1.05] font-black text-on-surface">
                    {appointment.customerName.trim() || text('appointmentNoClient')}
                  </p>
                  <p className="mt-2 text-[15px] leading-[1.5] text-content-secondary">{currentWhen}</p>
                  <p className="mt-1 text-[14px] text-content-secondary">{currentMeta}</p>
                </SummaryCard>

                <InfoCard title={text('appointmentRescheduleSectionPlan')} icon="edit_calendar_outlined">
                  <TimeSlotPicker
                    day={reschedule.day}
                    time={reschedule.time}
                    durationMinutes={appointment.service.durationMinutes}
                    availableDates={reschedule.availableDates}
                    slots={reschedule.slots}
                    datesLoading={reschedule.datesLoading}
                    slotsLoading={reschedule.slotsLoading}
                    emptyDatesMessage={text('appointmentRescheduleNoDates')}
                    onDayChange={reschedule.setDay}
                    onTimeChange={reschedule.setTime}
                    showDuration={false}
                  />
                </InfoCard>

                <div className="flex flex-wrap gap-3">
                  <Button
                    icon="save_outlined"
                    loading={reschedule.isSaving}
                    disabled={!reschedule.canSave || reschedule.isSaving}
                    onClick={reschedule.save}
                  >
                    {text('appointmentRescheduleSave')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={reschedule.goBack}>
                    {text('adminCommonCancel')}
                  </Button>
                </div>
              </>
            )}
            {reschedule.isSaving && <LoadingBarrier message={text('appointmentRescheduleSavingBarrier')} />}
          </div>
        </div>
      )}
    </div>
  );
}
