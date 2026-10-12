import { useState } from 'react';
import { useIntl } from 'react-intl';

import { UserAppointments } from '@/features/appointments';
import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatInstant, type DateLocale } from '@/shared/lib/business-time';
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
  showErrorToast,
  showToast,
  Spinner,
  StatusPill,
  SummaryCard,
  useElementWidth,
  type DetailLayout,
} from '@/shared/ui';

import { useStaffDetail } from '../../hooks/use-staff-detail';
import { fullNameOf, orDash, staffStatus, type AdminUser } from '../../model/admin-user';

/** `/admins/{id}` (StaffAdminDetailScreen). */
export function StaffDetailScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const detail = useStaffDetail({
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
            title={intl.formatMessage({ id: 'staffDetailTitle' })}
            subtitle={intl.formatMessage({ id: 'staffDetailSubtitle' })}
            titleSize={layout.titleSize}
            subtitleSize={layout.subtitleSize}
            back={{ label: intl.formatMessage({ id: 'staffBackToList' }), onClick: detail.goBack }}
          />
          <div style={{ marginTop: width < 700 ? 12 : layout.gap }}>
            {detail.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : detail.error || !user ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({ id: 'staffLoadError' })}
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
              <StaffDetailContent detail={detail} user={user} layout={layout} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Detail = ReturnType<typeof useStaffDetail>;

function StaffDetailContent({
  detail,
  user,
  layout,
}: {
  detail: Detail;
  user: AdminUser;
  layout: DetailLayout;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const locale = intl.locale as DateLocale;
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const status = staffStatus(user, 'detail');
  const name = fullNameOf(user) || text('adminUserUnnamed');
  const registered = formatInstant(user.createdAt, locale, 'mediumDate');

  // The avatar and name stay in the summary; Flutter repeats them here (approved improvement).
  const personal = (
    <InfoCard title={text('staffSectionPersonalInfo')} icon="person_outline">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('appointmentFieldPhone')} value={orDash(user.phone)} />
        <DetailRow label={text('appointmentFieldEmail')} value={orDash(user.email)} />
      </dl>
    </InfoCard>
  );

  const account = (
    <InfoCard title={text('staffSectionAccount')} icon="admin_panel_settings_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('staffAccountTypeLabel')} value={text('staffAccountTypeValue')} />
        <DetailRow label={text('clientFieldRegistration')} value={registered} />
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
    <InfoCard title={text('staffSectionActions')} icon="bolt_outlined">
      <div className="flex flex-col gap-3">
        <Button variant="secondary" icon="edit_outlined" onClick={detail.edit}>
          {text('staffActionEdit')}
        </Button>
        <Button
          variant="secondary"
          icon="mark_email_read_outlined"
          loading={detail.isSendingPasswordEmail}
          onClick={detail.sendPasswordEmail}
        >
          {text(detail.isSendingPasswordEmail ? 'clientActionSendingEmail' : 'clientActionSendPasswordEmail')}
        </Button>
        {user.isActive ? (
          <Button
            variant="dangerTonal"
            icon="block_outlined"
            loading={detail.isChangingActive}
            onClick={() => {
              setConfirmingDeactivate(true);
            }}
          >
            {text('staffActionDeactivate')}
          </Button>
        ) : (
          <Button
            variant="successTonal"
            icon="check_circle_outline"
            loading={detail.isChangingActive}
            onClick={() => {
              detail.setActive(true);
            }}
          >
            {text('staffActionActivate')}
          </Button>
        )}
      </div>
    </InfoCard>
  );

  const statusPill = <StatusPill size="large" label={text(status.label)} tone={status.tone} />;
  return (
    <div className="flex flex-col" style={{ gap: layout.gapLarge }}>
      <SummaryCard>
        <div
          style={{ padding: layout.summaryPadding }}
          className={layout.twoColumns ? 'flex items-center gap-5' : 'flex flex-col items-start gap-4'}
        >
          <div className="min-w-0 flex-1 self-stretch">
            <div className="flex items-center gap-4">
              <Avatar src={user.avatarUrl} size={72} viewLabel={text('adminUserViewPhoto')} />
              <div className="min-w-0 flex-1">
                <p className="text-[28px] leading-[1.05] font-black text-on-surface">{name}</p>
                <p className="mt-2 text-[15px] leading-[1.5] text-content-secondary">
                  {intl.formatMessage({ id: 'staffRegisteredSummary' }, { date: registered })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex">
              <StatusPill size="summary" tone="neutralStrong" label={text('staffRoleLabel')} />
            </div>
          </div>
          {statusPill}
        </div>
      </SummaryCard>
      {layout.twoColumns ? (
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {personal}
            {notes}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {account}
            {actions}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {personal}
          {account}
          {notes}
          {actions}
        </div>
      )}
      {/* The account may also book: Flutter lists its appointments, so the section stays. */}
      <InfoCard title={text('staffSectionAppointments')} icon="calendar_month_outlined">
        <UserAppointments
          userId={user.id}
          label={text('staffSectionAppointments')}
          customerName={name}
          emptyMessage={text('staffAppointmentsEmpty')}
          useTable={layout.twoColumns}
          onChanged={detail.refresh}
        />
      </InfoCard>
      <ConfirmDialog
        open={confirmingDeactivate}
        onOpenChange={setConfirmingDeactivate}
        title={text('staffDeactivateDialogTitle')}
        message={text('staffDeactivateDialogBody')}
        confirmLabel={text('staffDeactivateConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={() => {
          detail.setActive(false);
        }}
      />
    </div>
  );
}
