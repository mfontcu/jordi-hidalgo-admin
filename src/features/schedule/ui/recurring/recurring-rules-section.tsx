import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { WEEKDAYS, type Weekday } from '@/shared/lib/business-time';
import {
  ActionPicker,
  Button,
  ConfirmDialog,
  EmptyState,
  FilterPicker,
  ListPage,
  RemovableChip,
  showErrorToast,
  showToast,
  Spinner,
  StatCard,
  SummaryGrid,
  ToolbarField,
  useListLayout,
} from '@/shared/ui';

import { useRecurringRulesList } from '../../hooks/use-recurring-rules-list';
import type { RecurringStatusFilter } from '../../model/blocked-slots-search';
import { nextOccurrenceLabel, nextRuleOf } from '../../model/recurring-rule';
import { localeOf, textOf, weekdayName } from '../shared/labels';
import { RecurringRulesRows } from './recurring-rules-rows';

type List = ReturnType<typeof useRecurringRulesList>;

/** The recurring tab (RecurringBlockedSlotsScreen): summary, weekday and status filters, and the rules. */
export function RecurringRulesSection({ tabs }: { tabs: ReactNode }) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const list = useRecurringRulesList({
    onDeleted: () => {
      showToast(text('scheduleRecurringBlockedSlotDeleteSuccess'));
    },
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });

  return (
    <ListPage
      title={text('scheduleRecurringBlockedSlotsTitle')}
      subtitle={text('scheduleRecurringBlockedSlotsSubtitle')}
      beforeSummary={tabs}
      summaryLabel={text('adminSummaryTitle')}
      summary={<Summary list={list} />}
      toolbar={<Toolbar list={list} />}
    >
      {list.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={36} className="text-primary" />
        </div>
      ) : list.error ? (
        <EmptyState
          icon="error_outline"
          title={text('scheduleRecurringBlockedSlotsLoadError')}
          message={describeFailure(list.error)}
          action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: list.retry }}
        />
      ) : list.pageInfo.totalItems === 0 ? (
        <EmptyState
          icon="repeat_rounded"
          title={text('scheduleRecurringBlockedSlotsEmptyTitle')}
          message={text('scheduleRecurringBlockedSlotsEmptyMessage')}
          action={{ label: text('scheduleRecurringBlockedSlotsEmptyAction'), onClick: list.create }}
        />
      ) : (
        <RecurringRulesRows
          rules={list.rows}
          today={list.today}
          pageInfo={list.pageInfo}
          refreshing={list.isRefreshing}
          onOpen={list.open}
          onDelete={list.askDelete}
          onPageChange={list.goToPage}
        />
      )}
      <ConfirmDialog
        open={list.deleting !== null}
        onOpenChange={(open) => {
          if (!open) list.cancelDelete();
        }}
        title={text('scheduleRecurringBlockedSlotDeleteTitle')}
        message={text('scheduleRecurringBlockedSlotDeleteMessage')}
        cancelLabel={text('adminCommonCancel')}
        confirmLabel={text('adminCommonDelete')}
        onConfirm={list.confirmDelete}
      />
    </ListPage>
  );
}

function Summary({ list }: { list: List }) {
  const intl = useIntl();
  const text = textOf(intl);
  const summary = list.list?.summary;
  const next = list.list ? nextRuleOf(list.list) : null;
  const card = (
    key: 'ActiveRules' | 'AffectedDays' | 'WeeklyRanges' | 'NextApplication',
    value: string,
    valueSize?: number,
  ) => (
    <StatCard
      title={text(`scheduleRecurringSummary${key}Title`)}
      value={value}
      subtitle={text(`scheduleRecurringSummary${key}Subtitle`)}
      valueSize={valueSize}
    />
  );
  return (
    <SummaryGrid count={4}>
      {card('ActiveRules', String(summary?.activeRules ?? 0))}
      {card('AffectedDays', String(summary?.affectedDays ?? 0))}
      {card('WeeklyRanges', String(summary?.weeklyRanges ?? 0))}
      {card('NextApplication', next ? nextOccurrenceLabel(next, list.today, localeOf(intl)) : '—', 24)}
    </SummaryGrid>
  );
}

const STATUS_LABELS: Record<RecurringStatusFilter, MessageId> = {
  all: 'scheduleRecurringStatusAll',
  active: 'scheduleRecurringStatusActive',
  inactive: 'scheduleRecurringStatusInactive',
};

type WeekdayPick = 'all' | `${Weekday}`;

/**
 * RecurringBlockedSlotsToolbar: weekday, status, and new rule. Closing the weekday sheet without a
 * choice keeps the filter; Flutter clears it.
 */
function Toolbar({ list }: { list: List }) {
  const intl = useIntl();
  const text = textOf(intl);
  const { compact } = useListLayout();
  const grow = compact ? 'w-full' : 'min-w-0 flex-1';
  const weekdayLabel = list.weekday === null ? text('scheduleWeekdayAll') : weekdayName(intl, list.weekday);
  const statusLabel = text(STATUS_LABELS[list.status]);

  const weekday = (
    <ActionPicker<WeekdayPick>
      compact={compact}
      trigger={<ToolbarField icon="calendar_today_rounded" label={weekdayLabel} className="w-full" />}
      title={text('scheduleRecurringFilterWeekdayTitle')}
      subtitle=""
      options={[
        { value: 'all', icon: 'calendar_view_week_outlined', label: text('scheduleWeekdayAll') },
        ...WEEKDAYS.map((day) => ({
          value: `${day}` as const,
          icon: 'calendar_today_outlined' as const,
          label: weekdayName(intl, day),
        })),
      ]}
      onPick={(pick) => {
        list.applyWeekday(pick === 'all' ? null : (Number(pick) as Weekday));
      }}
    />
  );
  const status = (
    <FilterPicker<RecurringStatusFilter>
      compact={compact}
      trigger={<ToolbarField icon="tune_rounded" label={statusLabel} className="w-full" />}
      title={text('scheduleRecurringFilterStatusTitle')}
      subtitle=""
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={(['all', 'active', 'inactive'] as const).map((value) => ({
        value,
        label: text(STATUS_LABELS[value]),
      }))}
      value={list.status}
      clearValue="all"
      onApply={list.applyStatus}
    />
  );
  const create = (
    <Button icon="add" onClick={list.create} className={compact ? 'h-12 w-full' : 'h-12 shrink-0'}>
      {text('scheduleRecurringBlockedSlotNew')}
    </Button>
  );

  // The list opens on the active rules, so that filter shows no chip; removing a chip goes back to it.
  const chips = [
    list.weekday !== null && {
      label: weekdayLabel,
      onRemove: () => {
        list.applyWeekday(null);
      },
    },
    list.status !== 'active' && {
      label: statusLabel,
      onRemove: () => {
        list.applyStatus('active');
      },
    },
  ].filter((chip) => chip !== false);

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {weekday}
          {status}
          {create}
        </>
      ) : (
        <div className="flex items-center gap-3">
          <div className={grow}>{weekday}</div>
          <div className={grow}>{status}</div>
          {create}
        </div>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <RemovableChip
              key={chip.label}
              label={chip.label}
              removeLabel={intl.formatMessage({ id: 'adminFilterRemove' }, { filter: chip.label })}
              onRemove={chip.onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
