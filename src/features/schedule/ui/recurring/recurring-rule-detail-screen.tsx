import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import {
  Button,
  ConfirmDialog,
  detailLayoutFor,
  EmptyState,
  InfoCard,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  StatusPill,
  SummaryCard,
  useElementWidth,
  useWindowNarrowerThan,
  type DetailLayout,
} from '@/shared/ui';

import { useRecurringRuleDetail } from '../../hooks/use-recurring-rule-detail';
import { useRuleException } from '../../hooks/use-rule-exception';
import {
  affectedRangeOf,
  nextOccurrenceLabel,
  ruleTimeRange,
  type RecurringRule,
} from '../../model/recurring-rule';
import { dotted, localeOf, ruleReasonText, textOf, weekdayName } from '../shared/labels';
import { ExceptionSheet } from './exception-sheet';
import { ExceptionsList } from './exceptions-list';

type Detail = ReturnType<typeof useRecurringRuleDetail>;

/** `/schedule/recurring-blocked-slots/{id}` (RecurringBlockedSlotDetailScreen). */
export function RecurringRuleDetailScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const detail = useRecurringRuleDetail({
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  const [ref, width] = useElementWidth();
  const layout = detailLayoutFor(width ?? 1440);

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={text('scheduleRecurringBlockedSlotDetailTitle')}
            subtitle={text('scheduleRecurringBlockedSlotDetailSubtitle')}
            titleSize={layout.titleSize}
            subtitleSize={layout.subtitleSize}
            back={{ label: text('scheduleRecurringBlockedSlotBack'), onClick: detail.goBack }}
          />
          <div style={{ marginTop: width < 700 ? 12 : layout.gap }}>
            {detail.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : detail.error || !detail.rule ? (
              <EmptyState
                icon="error_outline"
                title={text('scheduleRecurringBlockedSlotNotAvailableTitle')}
                message={describeFailure(detail.error)}
                action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: detail.retry }}
              />
            ) : (
              <DetailContent rule={detail.rule} layout={layout} detail={detail} />
            )}
          </div>
          <ConfirmDialog
            open={detail.confirmingDelete}
            onOpenChange={detail.setConfirmingDelete}
            title={text('scheduleRecurringBlockedSlotDeleteTitle')}
            message={text('scheduleRecurringBlockedSlotDeleteMessage')}
            cancelLabel={text('adminCommonCancel')}
            confirmLabel={text('adminCommonDelete')}
            onConfirm={detail.remove}
          />
        </div>
      )}
    </div>
  );
}

type ContentProps = { rule: RecurringRule; layout: DetailLayout; detail: Detail };

function DetailContent({ rule, layout, detail }: ContentProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const locale = localeOf(intl);
  const describeFailure = useDescribeFailure();
  const narrowWindow = useWindowNarrowerThan(700);
  const exception = useRuleException(rule, {
    onSaved: () => {
      showToast(text('scheduleRecurringBlockedSlotExceptionSaveSuccess'));
    },
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  const weekday = weekdayName(intl, rule.weekday);
  const range = ruleTimeRange(rule);
  const next = nextOccurrenceLabel(rule, detail.today, locale);
  const statusLabel = text(
    rule.isActive ? 'scheduleRecurringStatusActiveSingular' : 'scheduleRecurringStatusInactiveSingular',
  );
  const affected = text(affectedRangeOf(rule));

  const summaryMain = (
    <div className="min-w-0 flex-1">
      <p className="text-[28px] leading-[1.05] font-black text-on-surface">{dotted(weekday, range)}</p>
      <p className="mt-2 text-[15px] leading-[1.5] text-content-secondary">
        {intl.formatMessage(
          { id: 'scheduleRecurringBlockedSlotDetailNextApplication' },
          { occurrence: next },
        )}
      </p>
      <span className="mt-4 inline-block rounded-pill bg-info-bg px-3.5 py-2.5 font-bold text-info-fg">
        {affected}
      </span>
    </div>
  );
  const summaryStatus = (
    <StatusPill size="large" label={statusLabel} tone={rule.isActive ? 'success' : 'neutral'} />
  );
  const summary = (
    <SummaryCard>
      <div
        className={
          layout.twoColumns ? 'flex w-full items-start gap-5' : 'flex w-full flex-col items-start gap-4'
        }
        style={{ padding: layout.summaryPadding }}
      >
        {summaryMain}
        {summaryStatus}
      </div>
    </SummaryCard>
  );

  const row = (label: string, value: string) => (
    <div className="flex items-start">
      <dt className="w-[150px] shrink-0 font-bold text-content-secondary">{label}</dt>
      <dd className="min-w-0 flex-1 leading-[1.45] [overflow-wrap:anywhere] text-on-surface">{value}</dd>
    </div>
  );
  const configuration = (
    <InfoCard title={text('scheduleRecurringBlockedSlotDetailRuleConfiguration')} icon="repeat_rounded">
      <dl className="flex flex-col gap-3.5 pb-3.5">
        {row(text('availabilityFieldDay'), weekday)}
        {row(text('scheduleBlockedSlotTableSchedule'), range)}
        {row(text('scheduleFieldReason'), ruleReasonText(intl, rule))}
      </dl>
    </InfoCard>
  );
  const availability = (
    <InfoCard title={text('scheduleRecurringBlockedSlotDetailAvailabilitySection')} icon="toggle_on_outlined">
      <dl className="flex flex-col gap-3.5 pb-3.5">
        {row(text('appointmentTableStatusColumn'), statusLabel)}
        {row(text('scheduleRecurringBlockedSlotDetailAppliesOn'), affected)}
        {row(text('scheduleRecurringBlockedSlotTableNextApplication'), next)}
      </dl>
    </InfoCard>
  );
  const exceptions = (
    <InfoCard
      title={text('scheduleRecurringBlockedSlotDetailExceptionsSection')}
      icon="event_available_outlined"
    >
      <ExceptionsList
        exceptions={detail.exceptions}
        error={detail.exceptionsError}
        onRetry={detail.retryExceptions}
        variant="detail"
      />
    </InfoCard>
  );
  const actions = (
    <InfoCard title={text('scheduleBlockedSlotFormActionsSection')} icon="bolt_outlined">
      <div className="flex flex-col gap-3">
        <div className={narrowWindow ? 'flex flex-col gap-3' : 'flex gap-3 [&>*]:flex-1'}>
          <Button icon="edit_outlined" onClick={detail.edit}>
            {text('scheduleRecurringBlockedSlotActionEditRule')}
          </Button>
          <Button
            variant="secondary"
            icon={rule.isActive ? 'pause_circle_outline' : 'play_circle_outline'}
            loading={detail.isChangingActive}
            onClick={detail.toggleActive}
          >
            {text(
              rule.isActive
                ? 'scheduleRecurringBlockedSlotActionDeactivateRule'
                : 'scheduleRecurringBlockedSlotActionActivateRule',
            )}
          </Button>
        </div>
        <Button
          variant="secondary"
          icon="event_available_outlined"
          onClick={() => {
            exception.setOpen(true);
          }}
        >
          {text('scheduleRecurringBlockedSlotFormAddException')}
        </Button>
        <Button
          variant="danger"
          icon="delete_outline"
          onClick={() => {
            detail.setConfirmingDelete(true);
          }}
        >
          {text('scheduleRecurringBlockedSlotActionDeleteRule')}
        </Button>
      </div>
    </InfoCard>
  );

  return (
    <>
      {summary}
      <div style={{ marginTop: layout.gapLarge }}>
        {layout.twoColumns ? (
          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {configuration}
              {exceptions}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {availability}
              {actions}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {configuration}
            {availability}
            {exceptions}
            {actions}
          </div>
        )}
      </div>
      <ExceptionSheet rule={rule} exception={exception} />
    </>
  );
}
