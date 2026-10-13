import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import {
  ActionGroup,
  ConfirmDialog,
  DetailRow,
  EmptyState,
  InfoCard,
  PageHeader,
  showErrorToast,
  Spinner,
  StatusPill,
  useElementWidth,
} from '@/shared/ui';

import { useBlockedSlotDetail } from '../../hooks/use-blocked-slot-detail';
import {
  blockedSlotDate,
  blockedSlotType,
  blockedSlotVisibility,
  type BlockedSlot,
} from '../../model/blocked-slot';
import { dotted, blockedSlotTimeText, localeOf, textOf } from '../shared/labels';

/** `/schedule/blocked-slots/{id}` (BlockedSlotDetailScreen): summary, settings, and actions. */
export function BlockedSlotDetailScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const detail = useBlockedSlotDetail({
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  const [ref, width] = useElementWidth();
  // BlockedSlotDetailScreen's own layout: two columns from 960px.
  const compact = (width ?? 1440) < 960;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: compact ? 16 : 24 }}>
          <PageHeader
            title={text('scheduleBlockedSlotDetailTitle')}
            subtitle={text('scheduleBlockedSlotDetailSubtitle')}
            back={{ label: text('scheduleBlockedSlotBack'), onClick: detail.goBack }}
            backAlign="center"
          />
          <div style={{ marginTop: width < 768 ? 12 : 24 }}>
            {detail.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : detail.error || !detail.slot ? (
              <EmptyState
                icon="error_outline"
                title={text('scheduleBlockedSlotNotAvailableTitle')}
                message={describeFailure(detail.error)}
                action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: detail.retry }}
              />
            ) : (
              <DetailContent slot={detail.slot} compact={compact} detail={detail} />
            )}
          </div>
          <ConfirmDialog
            open={detail.confirmingDelete}
            onOpenChange={detail.setConfirmingDelete}
            title={text('scheduleBlockedSlotDeleteTitle')}
            message={text('scheduleBlockedSlotDeleteMessage')}
            cancelLabel={text('adminCommonCancel')}
            confirmLabel={text('adminCommonDelete')}
            onConfirm={detail.remove}
          />
        </div>
      )}
    </div>
  );
}

type ContentProps = { slot: BlockedSlot; compact: boolean; detail: ReturnType<typeof useBlockedSlotDetail> };

function DetailContent({ slot, compact, detail }: ContentProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const date = blockedSlotDate(slot, localeOf(intl));
  const time = blockedSlotTimeText(intl, slot);
  const type = blockedSlotType(slot);
  const visibility = blockedSlotVisibility(slot);

  const summary = (
    <InfoCard title={text('scheduleBlockedSlotDetailSummarySection')} icon="block_outlined">
      <p className="text-title text-foreground">{dotted(date, time)}</p>
      <div className="mt-3 flex flex-col items-start gap-2">
        <StatusPill label={text(type.label)} tone={type.tone} />
        <StatusPill label={text(visibility.label)} tone={visibility.tone} />
      </div>
      <p className="mt-3 text-body-strong text-foreground">{slot.reason}</p>
    </InfoCard>
  );
  const settings = (
    <InfoCard title={text('scheduleBlockedSlotDetailConfigurationSection')} icon="tune_outlined">
      <dl className="flex flex-col gap-3.5">
        <DetailRow label={text('appointmentFieldDate')} value={date} labelWidth={110} />
        <DetailRow label={text('scheduleBlockedSlotTableSchedule')} value={time} labelWidth={110} />
        <DetailRow label={text('scheduleFieldReason')} value={slot.reason} labelWidth={110} />
        <DetailRow
          label={text('scheduleBlockedSlotFormWebVisibilitySection')}
          value={text(visibility.label)}
          labelWidth={110}
        />
      </dl>
    </InfoCard>
  );
  const actions = (
    <InfoCard title={text('scheduleBlockedSlotFormActionsSection')} icon="bolt_outlined">
      <ActionGroup
        primary={{
          label: text('scheduleBlockedSlotActionEdit'),
          icon: 'edit_outlined',
          onClick: detail.edit,
        }}
        danger={{
          label: text('scheduleBlockedSlotActionDelete'),
          icon: 'delete_outline',
          onClick: () => {
            detail.setConfirmingDelete(true);
          },
        }}
      />
    </InfoCard>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-4">
        {summary}
        {settings}
        {actions}
      </div>
    );
  }
  return (
    <div className="flex items-start gap-4">
      <div className="flex min-w-0 flex-[6] flex-col gap-4">
        {summary}
        {settings}
      </div>
      <div className="min-w-0 flex-[4]">{actions}</div>
    </div>
  );
}
