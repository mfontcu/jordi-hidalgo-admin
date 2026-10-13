import { useState, type CSSProperties } from 'react';
import { useIntl } from 'react-intl';

import { ClientOperationalBanner } from '@/features/users';
import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { failureOf } from '@/shared/lib/failure';
import { formatInstantDateTime, type DateLocale } from '@/shared/lib/business-time';
import {
  ActionPicker,
  Avatar,
  Button,
  ConfirmDialog,
  detailLayoutFor,
  DetailRow,
  EmptyState,
  InfoCard,
  MutedPanel,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  StatusPill,
  SummaryCard,
  Textarea,
  useElementWidth,
  useWindowNarrowerThan,
  type DetailLayout,
} from '@/shared/ui';

import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import {
  CUSTOMER_PUSH_MAX_LENGTH,
  formatPrice,
  isActiveChainEntry,
  pushBodyOf,
  pushDeliveryLabelOf,
  rowActionsOf,
  statusLabelOf,
  statusToneOf,
  type AppointmentDetail,
  type CustomerPushMessage,
  type RescheduleChainEntry,
} from '../model/appointment';

type StatusPick = 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
type RowDialog = 'complete' | 'noShow' | 'cancel' | 'push';

/** `/appointments/{id}` (AppointmentDetailScreen). */
export function AppointmentDetailScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const detail = useAppointmentDetail({
    onSuccess: (message) => showToast(intl.formatMessage({ id: message })),
    onError: (error, context) => showErrorToast(describeFailure(error, context)),
    onTooEarly: (message) => showErrorToast(intl.formatMessage({ id: message })),
    onPushSpecial: (message, phone) => {
      if (message === 'customerPushNoTokens' && phone) {
        showErrorToast(
          intl.formatMessage({ id: 'customerPushNoTokens' }) +
            (phone ? ` ${intl.formatMessage({ id: 'customerPushCall' })}: ${phone}` : ''),
        );
        return;
      }
      showErrorToast(intl.formatMessage({ id: message }));
    },
  });
  const [ref, width] = useElementWidth();
  const layout = detailLayoutFor(width ?? 1440);
  const appointment = detail.appointment;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={intl.formatMessage({ id: 'appointmentDetailTitle' })}
            subtitle={intl.formatMessage({ id: 'appointmentDetailSubtitle' })}
            back={{ label: intl.formatMessage({ id: 'appointmentBackToList' }), onClick: detail.goBack }}
          />
          <div style={{ marginTop: width < 768 ? 12 : layout.gap }}>
            {detail.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : detail.error || !appointment ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({ id: 'appointmentLoadError' })}
                message={
                  failureOf(detail.error).kind === 'notFound'
                    ? intl.formatMessage({ id: 'adminErrorNotFound' })
                    : describeFailure(detail.error)
                }
                action={
                  failureOf(detail.error).kind === 'notFound'
                    ? undefined
                    : {
                        label: intl.formatMessage({ id: 'adminCommonRetry' }),
                        icon: 'refresh',
                        onClick: detail.retry,
                      }
                }
              />
            ) : (
              <AppointmentDetailContent detail={detail} appointment={appointment} layout={layout} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Detail = ReturnType<typeof useAppointmentDetail>;

function AppointmentDetailContent({
  detail,
  appointment,
  layout,
}: {
  detail: Detail;
  appointment: AppointmentDetail;
  layout: DetailLayout;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = intl.locale as DateLocale;
  const compactPicker = useWindowNarrowerThan(640);
  const [dialog, setDialog] = useState<RowDialog | null>(null);
  const [pushText, setPushText] = useState('');

  const userName = appointment.user?.fullName.trim() ?? '';
  const customerName = userName || appointment.customerName.trim() || text('appointmentNoClient');
  const statusId = statusLabelOf(appointment.status);
  const statusLabel = statusId ? text(statusId) : appointment.status;
  const serviceWhen = [
    appointment.service.name,
    formatInstantDateTime(appointment.start, locale, 'longDate', 'HH:mm'),
  ].join(' · ');
  const phone = appointment.user?.phone.trim() ?? '';
  const email = appointment.user?.email.trim() ?? '';

  const summary = (
    <SummaryCard>
      <div
        style={{ padding: layout.summaryPadding }}
        className={layout.twoColumns ? 'flex items-start gap-5' : 'flex flex-col gap-4'}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            {appointment.userId && (
              <Avatar src={appointment.customerAvatarUrl} size={72} viewLabel={text('adminUserViewPhoto')} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-title text-foreground">{customerName}</p>
              <p className="mt-2 text-body text-muted-foreground">{serviceWhen}</p>
            </div>
          </div>
        </div>
        <div className="flex">
          <StatusPill size="large" label={statusLabel} tone={statusToneOf(appointment.status)} />
        </div>
      </div>
    </SummaryCard>
  );

  const client = (
    <InfoCard title={text('appointmentSectionClient')} icon="person_outline">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('appointmentFieldName')} value={customerName} />
        <DetailRow label={text('appointmentFieldPhone')} value={phone || text('appointmentNotAvailable')} />
        <DetailRow label={text('appointmentFieldEmail')} value={email || text('appointmentNotAvailable')} />
      </dl>
      {appointment.userId && (
        <Button variant="secondary" className="mt-4" icon="person_outline" onClick={detail.openClient}>
          {text('appointmentViewClientProfile')}
        </Button>
      )}
      {detail.client.isPending && detail.client.isFetching && (
        <p className="mt-3 text-label text-muted-foreground">{text('appointmentClientOperationalLoading')}</p>
      )}
      {detail.client.data && (
        <div className="mt-3">
          <ClientOperationalBanner user={detail.client.data} />
        </div>
      )}
    </InfoCard>
  );

  const appointmentInfo = (
    <InfoCard title={text('appointmentSectionAppointment')} icon="event_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow
          label={text('appointmentFieldDate')}
          value={formatInstantDateTime(appointment.start, locale, 'longDate', 'HH:mm')}
        />
        <DetailRow
          label={text('appointmentFieldEndTime')}
          value={
            appointment.end
              ? formatInstantDateTime(appointment.end, locale, 'longDate', 'HH:mm')
              : text('appointmentNotAvailable')
          }
        />
      </dl>
    </InfoCard>
  );

  const service = (
    <InfoCard title={text('appointmentSectionService')} icon="content_cut_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('appointmentSectionService')} value={appointment.service.name} />
        <DetailRow
          label={text('appointmentFieldPrice')}
          value={formatPrice(appointment.service.priceCents)}
        />
        <DetailRow
          label={text('appointmentFieldDescription')}
          value={appointment.service.description.trim() || text('appointmentNoDescription')}
        />
        <DetailRow
          label={text('appointmentFieldDuration')}
          value={intl.formatMessage(
            { id: 'appointmentFieldDurationMinutes' },
            { minutes: appointment.service.durationMinutes },
          )}
        />
      </dl>
    </InfoCard>
  );

  const statusSection = (
    <InfoCard title={text('appointmentSectionStatus')} icon="flag_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('appointmentFieldCurrentStatus')} value={statusLabel} />
        <DetailRow
          label={text('appointmentFieldCancelledBy')}
          value={appointment.cancelledBy.trim() || text('appointmentNotApplicable')}
        />
        <DetailRow
          label={text('appointmentFieldEndTime')}
          value={
            appointment.end
              ? formatInstantDateTime(appointment.end, locale, 'longDate', 'HH:mm')
              : text('appointmentNotAvailable')
          }
        />
      </dl>
    </InfoCard>
  );

  const notesText = (() => {
    const parts: string[] = [];
    if (appointment.customerNotes.trim()) {
      parts.push(`${text('appointmentNoteClientPrefix')} ${appointment.customerNotes.trim()}`);
    }
    if (appointment.internalNotes.trim()) {
      parts.push(`${text('appointmentNoteInternalPrefix')} ${appointment.internalNotes.trim()}`);
    }
    if (appointment.cancellationReason.trim()) {
      parts.push(`${text('appointmentNoteCancellationPrefix')} ${appointment.cancellationReason.trim()}`);
    }
    return parts.length > 0 ? parts.join('\n\n') : text('appointmentNoNotesRegistered');
  })();

  const notes = (
    <InfoCard title={text('appointmentSectionNotes')} icon="sticky_note_2_outlined">
      <MutedPanel className="p-4 text-body whitespace-pre-line text-muted-foreground">{notesText}</MutedPanel>
    </InfoCard>
  );

  const allowComplete = rowActionsOf(appointment).completeOrNoShow;
  const statusOptions = [
    {
      value: 'pending' as const,
      icon: 'schedule_outlined' as const,
      label: text('appointmentStatusPending'),
    },
    {
      value: 'confirmed' as const,
      icon: 'check_circle_outline' as const,
      label: text('appointmentStatusConfirmed'),
    },
    ...(allowComplete
      ? [
          {
            value: 'completed' as const,
            icon: 'task_alt_outlined' as const,
            label: text('appointmentStatusCompleted'),
          },
        ]
      : []),
    {
      value: 'cancelled' as const,
      icon: 'cancel_outlined' as const,
      label: text('appointmentStatusCancelled'),
    },
    ...(allowComplete
      ? [
          {
            value: 'no_show' as const,
            icon: 'person_off_outlined' as const,
            label: text('appointmentStatusNoShow'),
          },
        ]
      : []),
  ];

  const applyStatusPick = (pick: StatusPick) => {
    if (pick === appointment.status.trim().toLowerCase()) return;
    if (pick === 'cancelled') {
      setDialog('cancel');
      return;
    }
    if (pick === 'completed') {
      setDialog('complete');
      return;
    }
    if (pick === 'no_show') {
      setDialog('noShow');
      return;
    }
    if (pick === 'pending') detail.setPending();
    if (pick === 'confirmed') detail.setConfirmed();
  };

  const actions = (
    <InfoCard title={text('appointmentSectionActions')} icon="bolt_outlined">
      {detail.isFinal ? (
        <MutedPanel className="p-4 text-body text-muted-foreground">
          {text('appointmentFinalStatusNotice')}
        </MutedPanel>
      ) : (
        <div className="flex flex-col gap-3">
          <ActionPicker
            compact={compactPicker}
            trigger={
              <Button variant="secondary" icon="task_alt_outlined" className="w-full">
                {text('appointmentChangeStatusButton')}
              </Button>
            }
            title={text('appointmentChangeStatusTitle')}
            subtitle={text('appointmentFilterSubtitle')}
            options={statusOptions}
            onPick={applyStatusPick}
          />
          {detail.canReschedule ? (
            <Button variant="secondary" icon="edit_calendar_outlined" onClick={detail.openReschedule}>
              {text('appointmentRescheduleButton')}
            </Button>
          ) : (
            <MutedPanel className="p-4 text-label text-muted-foreground">
              {text('appointmentCannotRescheduleWithoutClient')}
            </MutedPanel>
          )}
          <Button
            variant="danger"
            icon="cancel_outlined"
            loading={detail.isBusy}
            onClick={() => {
              setDialog('cancel');
            }}
          >
            {text('appointmentCancelButton')}
          </Button>
        </div>
      )}
    </InfoCard>
  );

  const pushSection = detail.canPush ? (
    <InfoCard title={text('appointmentSectionCustomerPush')} icon="notifications_active_outlined">
      <Textarea
        rows={3}
        maxLength={CUSTOMER_PUSH_MAX_LENGTH}
        value={pushText}
        placeholder={text('customerPushHint')}
        onChange={(event) => {
          setPushText(event.target.value);
        }}
      />
      <div className="mt-3 flex justify-end">
        <Button
          icon="send_outlined"
          loading={detail.isPushing}
          disabled={!pushBodyOf(pushText) || detail.isPushing}
          onClick={() => {
            setDialog('push');
          }}
        >
          {text(detail.isPushing ? 'customerPushSending' : 'customerPushSendButton')}
        </Button>
      </div>
      <PushHistory
        messages={detail.pushMessages}
        loading={detail.pushLoading}
        error={detail.pushError}
        onRetry={detail.retryPush}
      />
    </InfoCard>
  ) : (
    <InfoCard title={text('appointmentSectionCustomerPush')} icon="notifications_active_outlined">
      <MutedPanel className="p-4 text-muted-foreground">{text('customerPushRegisteredOnly')}</MutedPanel>
    </InfoCard>
  );

  const chainSection =
    detail.showChain && detail.chain.length > 0 ? (
      <InfoCard title={text('appointmentRescheduleChainTitle')} icon="history_outlined">
        <p className="mb-3 text-label text-muted-foreground">
          {intl.formatMessage(
            { id: 'appointmentRescheduleChainLength' },
            { count: appointment.rescheduleChainLength },
          )}
        </p>
        <ul className="flex flex-col gap-2">
          {detail.chain.map((entry) => (
            <ChainRow key={entry.id} entry={entry} locale={locale} />
          ))}
        </ul>
      </InfoCard>
    ) : null;

  const style = { '--gap': `${layout.gapLarge}px` } as CSSProperties;
  const sections = [
    { key: 'client', node: client },
    { key: 'appointment', node: appointmentInfo },
    { key: 'service', node: service },
    { key: 'status', node: statusSection },
    { key: 'notes', node: notes },
    { key: 'actions', node: actions },
    { key: 'push', node: pushSection },
    { key: 'chain', node: chainSection },
  ].filter((section) => section.node != null);

  const renderSections = (items: typeof sections) =>
    items.map((section) => <div key={section.key}>{section.node}</div>);

  return (
    <div style={style}>
      {summary}
      <div className="mt-(--gap)">
        {layout.twoColumns ? (
          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {renderSections(sections.slice(0, Math.ceil(sections.length / 2)))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {renderSections(sections.slice(Math.ceil(sections.length / 2)))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">{renderSections(sections)}</div>
        )}
      </div>

      {dialog === 'complete' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          title={text('appointmentCompleteTitle')}
          message={intl.formatMessage({ id: 'appointmentCompleteBody' }, { customerName })}
          confirmLabel={text('appointmentCompleteConfirm')}
          cancelLabel={text('adminCommonCancel')}
          tone="emphasized"
          onConfirm={detail.complete}
        />
      )}
      {dialog === 'noShow' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          title={text('appointmentNoShowTitle')}
          message={intl.formatMessage({ id: 'appointmentNoShowBody' }, { customerName })}
          confirmLabel={text('appointmentNoShowConfirm')}
          cancelLabel={text('adminCommonCancel')}
          onConfirm={detail.markNoShow}
        />
      )}
      {dialog === 'cancel' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          title={text('appointmentCancelTitle')}
          message={text('appointmentCancelBody')}
          confirmLabel={text('appointmentCancelConfirm')}
          cancelLabel={text('adminCommonCancel')}
          onConfirm={detail.cancel}
        />
      )}
      {dialog === 'push' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          title={text('customerPushSendTitle')}
          message={text('customerPushSendBody')}
          confirmLabel={text('customerPushSendConfirm')}
          cancelLabel={text('adminCommonCancel')}
          tone="emphasized"
          onConfirm={() => {
            detail.sendPush(pushText);
            setPushText('');
          }}
        />
      )}
    </div>
  );
}

function PushHistory({
  messages,
  loading,
  error,
  onRetry,
}: {
  messages: CustomerPushMessage[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const describeFailure = useDescribeFailure();
  const locale = intl.locale as DateLocale;

  return (
    <div className="mt-5">
      <p className="mb-3 text-body-strong text-foreground">{text('appointmentSectionMessagesSent')}</p>
      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size={28} className="text-primary" />
        </div>
      ) : error ? (
        <EmptyState
          icon="error_outline"
          title={text('customerPushHistoryLoadError')}
          message={describeFailure(error)}
          action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: onRetry }}
        />
      ) : messages.length === 0 ? (
        <MutedPanel className="p-4 text-muted-foreground">{text('customerPushHistoryEmpty')}</MutedPanel>
      ) : (
        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {messages.map((message) => {
            const deliveryId = pushDeliveryLabelOf(message.deliveryStatus);
            const deliveryLabel = deliveryId ? text(deliveryId) : message.deliveryStatus;
            return (
              <li key={message.id} className="rounded-md border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusPill label={deliveryLabel} tone="info" />
                  <span className="text-caption text-muted-foreground">
                    {formatInstantDateTime(message.createdAt, locale, 'numericDate', 'HH:mm')}
                  </span>
                </div>
                <p className="mt-2 text-body text-foreground">{message.body}</p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {intl.formatMessage(
                    { id: 'customerPushDeliveryStats' },
                    { success: message.fcmSuccessCount, failed: message.fcmFailureCount },
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChainRow({ entry, locale }: { entry: RescheduleChainEntry; locale: DateLocale }) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const statusId = statusLabelOf(entry.status);
  const status = statusId ? text(statusId) : entry.status;
  const active = isActiveChainEntry(entry.status);
  const label = active
    ? `${status} · ${text('appointmentRescheduleChainActiveSuffix')}`
    : `${status}${entry.rescheduledBy ? ` · ${entry.rescheduledBy}` : ''}`;

  return (
    <MutedPanel className="flex flex-col gap-1 p-3">
      <p className="font-bold text-foreground">
        {formatInstantDateTime(entry.start, locale, 'longDate', 'HH:mm')}
      </p>
      <p className="text-label text-muted-foreground">{label}</p>
    </MutedPanel>
  );
}
