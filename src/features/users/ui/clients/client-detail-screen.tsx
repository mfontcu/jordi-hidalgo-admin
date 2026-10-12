import { useState } from 'react';
import { useIntl } from 'react-intl';

import { UserAppointments } from '@/features/appointments';
import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatInstant, formatInstantDateTime, type DateLocale } from '@/shared/lib/business-time';
import { failureOf } from '@/shared/lib/failure';
import {
  Avatar,
  Button,
  ConfirmDialog,
  detailLayoutFor,
  DetailRow,
  EmptyState,
  InfoCard,
  MutedPanel,
  PageHeader,
  PromptDialog,
  showErrorToast,
  showToast,
  Spinner,
  StatusPill,
  SummaryCard,
  useElementWidth,
  type DetailLayout,
} from '@/shared/ui';

import { useClientDetail } from '../../hooks/use-client-detail';
import { fullNameOf, orDash, type AdminUser } from '../../model/admin-user';
import { aliasOf, canBook, clientStatus, displayNameOf, isNoShowRisk, usesApp } from '../../model/client';

/** `/clients/{id}` (ClientDetailScreen). */
export function ClientDetailScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const detail = useClientDetail({
    onSuccess: (message) => showToast(intl.formatMessage({ id: message })),
    onError: (error, context) => showErrorToast(describeFailure(error, context)),
  });
  const [ref, width] = useElementWidth();
  const layout = detailLayoutFor(width ?? 1440);
  const user = detail.user;
  const notFound = failureOf(detail.error).kind === 'notFound';

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={intl.formatMessage({ id: 'clientDetailTitle' })}
            subtitle={intl.formatMessage({ id: 'clientDetailSubtitle' })}
            titleSize={layout.titleSize}
            subtitleSize={layout.subtitleSize}
            back={{
              label: detail.backLabel ?? intl.formatMessage({ id: 'clientBackToList' }),
              onClick: detail.goBack,
            }}
          />
          <div style={{ marginTop: width < 700 ? 12 : layout.gap }}>
            {detail.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : detail.error || !user ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({ id: 'clientLoadError' })}
                message={
                  notFound ? intl.formatMessage({ id: 'adminErrorNotFound' }) : describeFailure(detail.error)
                }
                action={
                  notFound
                    ? undefined
                    : {
                        label: intl.formatMessage({ id: 'adminCommonRetry' }),
                        icon: 'refresh',
                        onClick: detail.retry,
                      }
                }
              />
            ) : (
              <ClientDetailContent detail={detail} user={user} layout={layout} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Detail = ReturnType<typeof useClientDetail>;
type ContentProps = { detail: Detail; user: AdminUser; layout: DetailLayout };

function ClientDetailContent({ detail, user, layout }: ContentProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = intl.locale as DateLocale;
  const name = displayNameOf(user) || text('adminUserUnnamed');
  const appName = fullNameOf(user) || text('adminUserUnnamed');
  const alias = aliasOf(user);

  // The avatar and names stay in the summary; Flutter repeats them here (approved change, as in
  // the staff detail).
  const personal = (
    <InfoCard title={text('clientSectionPersonalInfo')} icon="person_outline">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('clientFieldAlias')} value={alias || '—'} />
        <DetailRow label={text('clientFieldAppName')} value={appName} />
        <DetailRow label={text('appointmentFieldPhone')} value={orDash(user.phone)} />
        <DetailRow label={text('appointmentFieldEmail')} value={orDash(user.email)} />
        <DetailRow
          label={text('clientFieldRegistration')}
          value={formatInstant(user.createdAt, locale, 'mediumDate')}
        />
        {user.isBlocked && (
          <>
            <DetailRow
              label={text('clientFieldBlockedSince')}
              value={formatInstantDateTime(user.blockedAt, locale, 'mediumDate')}
            />
            <DetailRow label={text('clientFieldBlockReason')} value={orDash(user.blockedReason)} />
          </>
        )}
      </dl>
    </InfoCard>
  );

  const activity = (
    <InfoCard title={text('clientSectionActivity')} icon="history_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow
          label={text('clientFieldLastAppointment')}
          value={formatInstant(user.lastAppointmentAt, locale, 'mediumDate')}
        />
        <DetailRow
          label={text('clientFieldNextAppointment')}
          value={formatInstantDateTime(user.nextAppointmentAt, locale, 'mediumDate')}
        />
        <DetailRow
          label={text('clientFieldFrequentServices')}
          value={user.frequentServices.length > 0 ? user.frequentServices.join(', ') : '—'}
        />
        <DetailRow label={text('clientNoShowCountLast90Days')} value={String(user.noShowCountLast90Days)} />
        <DetailRow
          label={text('clientRescheduleCountLast90Days')}
          value={String(user.rescheduleCountLast90Days)}
        />
        <DetailRow label={text('clientFieldTotalAppointments')} value={String(user.totalAppointments)} />
      </dl>
    </InfoCard>
  );

  const notes = (
    <InfoCard title={text('clientNotesSectionTitle')} icon="sticky_note_2_outlined">
      <MutedPanel>
        <p className="leading-[1.5] whitespace-pre-line text-content-secondary">
          {user.internalNotes.trim() || text('clientNotesEmpty')}
        </p>
      </MutedPanel>
    </InfoCard>
  );

  const actions = (
    <InfoCard title={text('clientSectionActions')} icon="bolt_outlined">
      <ClientActions detail={detail} user={user} />
    </InfoCard>
  );

  return (
    <div className="flex flex-col" style={{ gap: layout.gapLarge }}>
      <ClientSummary user={user} layout={layout} />
      {layout.twoColumns ? (
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {personal}
            {notes}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {activity}
            {actions}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {personal}
          {activity}
          {notes}
          {actions}
        </div>
      )}
      <InfoCard title={text('clientSectionAppointments')} icon="calendar_month_outlined">
        <UserAppointments
          userId={user.id}
          label={text('clientSectionAppointments')}
          customerName={name}
          emptyMessage={text('clientAppointmentsEmpty')}
          useTable={layout.twoColumns}
          onChanged={detail.refresh}
        />
      </InfoCard>
    </div>
  );
}

/**
 * `_ClientSummaryCard`: avatar, display name, the name in the app under an alias, the last visit,
 * and the pills (appointments done, next appointment, no-show risk); the status on the side.
 */
function ClientSummary({ user, layout }: { user: AdminUser; layout: DetailLayout }) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = intl.locale as DateLocale;
  const status = clientStatus(user);
  const alias = aliasOf(user);

  return (
    <SummaryCard>
      <div
        style={{ padding: layout.summaryPadding }}
        className={layout.twoColumns ? 'flex items-center gap-5' : 'flex flex-col items-start gap-4'}
      >
        <div className="min-w-0 flex-1 self-stretch">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl} size={72} viewLabel={text('adminUserViewPhoto')} />
            <div className="min-w-0 flex-1">
              <p className="text-[28px] leading-[1.05] font-black text-on-surface">
                {displayNameOf(user) || text('adminUserUnnamed')}
              </p>
              {alias && (
                <p className="mt-1.5 text-[14px] leading-[1.4] text-content-secondary">
                  {intl.formatMessage(
                    { id: 'clientRegisteredInApp' },
                    { name: fullNameOf(user) || text('adminUserUnnamed') },
                  )}
                </p>
              )}
              <p className="mt-2 text-[15px] leading-[1.5] text-content-secondary">
                {intl.formatMessage(
                  { id: 'clientRegisteredSummary' },
                  { date: formatInstant(user.lastAppointmentAt, locale, 'mediumDate') },
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <StatusPill
              size="summary"
              tone="info"
              label={intl.formatMessage(
                { id: 'clientAppointmentsCompleted' },
                { count: user.totalAppointments },
              )}
            />
            <StatusPill
              size="summary"
              tone="neutralStrong"
              label={
                user.nextAppointmentAt
                  ? intl.formatMessage(
                      { id: 'clientNextAppointment' },
                      { dateTime: formatInstantDateTime(user.nextAppointmentAt, locale, 'mediumDate') },
                    )
                  : text('clientNoUpcomingAppointment')
              }
            />
            {isNoShowRisk(user) && (
              <StatusPill size="summary" tone="warning" label={text('clientNoShowRiskLabel')} />
            )}
          </div>
        </div>
        <StatusPill size="large" label={text(status.label)} tone={status.tone} />
      </div>
    </SummaryCard>
  );
}

type Dialog = 'verify' | 'block' | 'unblock' | 'delete' | null;

/** `_ClientActionsContent`: the account's actions, one per row, with their confirmations. */
function ClientActions({ detail, user }: { detail: Detail; user: AdminUser }) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const [dialog, setDialog] = useState<Dialog>(null);
  const hasEmail = usesApp(user);
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        icon="add_circle_outline"
        disabled={!canBook(user)}
        onClick={() => {
          detail.newAppointment(user, text('clientBackToDetail'));
        }}
      >
        {text('clientActionNewAppointment')}
      </Button>
      <Button variant="secondary" icon="edit_outlined" onClick={detail.edit}>
        {text('clientActionEdit')}
      </Button>
      {!user.isActive && !user.isBlocked && (
        <>
          {hasEmail && (
            <Button
              variant="secondary"
              icon="mark_email_unread_outlined"
              loading={detail.isSendingActivationEmail}
              onClick={detail.sendActivationEmail}
            >
              {text(
                detail.isSendingActivationEmail ? 'clientActionSendingEmail' : 'clientActionResendActivation',
              )}
            </Button>
          )}
          <Button
            variant="secondary"
            icon="verified_user_outlined"
            loading={detail.isVerifying}
            onClick={() => {
              setDialog('verify');
            }}
          >
            {text(detail.isVerifying ? 'clientActionVerifying' : 'clientActionVerifyManually')}
          </Button>
        </>
      )}
      {hasEmail && (
        <Button
          variant="secondary"
          icon="mark_email_read_outlined"
          loading={detail.isSendingPasswordEmail}
          onClick={detail.sendPasswordEmail}
        >
          {text(detail.isSendingPasswordEmail ? 'clientActionSendingEmail' : 'clientActionSendPasswordEmail')}
        </Button>
      )}
      {user.isBlocked ? (
        <Button
          variant="successTonal"
          icon="lock_open_outlined"
          loading={detail.isChangingBlock}
          onClick={() => {
            setDialog('unblock');
          }}
        >
          {text('clientActionUnblock')}
        </Button>
      ) : (
        <Button
          variant="dangerTonal"
          icon="block_outlined"
          loading={detail.isChangingBlock}
          onClick={() => {
            setDialog('block');
          }}
        >
          {text('clientActionBlock')}
        </Button>
      )}
      <Button
        variant="danger"
        icon="delete_outline"
        loading={detail.isDeleting}
        onClick={() => {
          setDialog('delete');
        }}
      >
        {text(detail.isDeleting ? 'clientActionDeleting' : 'clientActionDelete')}
      </Button>

      <ConfirmDialog
        open={dialog === 'verify'}
        onOpenChange={close}
        title={text('clientVerifyDialogTitle')}
        message={text('clientVerifyDialogBody')}
        confirmLabel={text('clientVerifyConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={detail.verify}
      />
      <PromptDialog
        open={dialog === 'block'}
        onOpenChange={close}
        title={text('clientBlockDialogTitle')}
        message={text('clientBlockDialogBody')}
        fieldLabel={text('clientFieldBlockReason')}
        fieldHint={text('clientBlockReasonHint')}
        confirmLabel={text('clientBlockConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={detail.setBlocked}
      />
      <ConfirmDialog
        open={dialog === 'unblock'}
        onOpenChange={close}
        title={text('clientUnblockDialogTitle')}
        message={text('clientUnblockDialogBody')}
        confirmLabel={text('clientUnblockConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={() => {
          detail.setBlocked(null);
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={close}
        title={text('clientDeleteDialogTitle')}
        message={text('clientDeleteDialogBody')}
        confirmLabel={text('clientDeleteConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={detail.remove}
      />
    </div>
  );
}
