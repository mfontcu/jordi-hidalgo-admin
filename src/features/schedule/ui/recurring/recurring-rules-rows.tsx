import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { paginationLabels } from '@/shared/i18n';
import type { BusinessDay } from '@/shared/lib/business-time';
import {
  DataTable,
  InlineAction,
  Pagination,
  RefreshOverlay,
  StatusPill,
  TableAction,
  useElementWidth,
  useListLayout,
  type DataTableColumn,
} from '@/shared/ui';

import { nextOccurrenceLabel, ruleTimeRange, type RecurringRule } from '../../model/recurring-rule';
import { localeOf, ruleReasonText, textOf, weekdayName } from '../shared/labels';

type RowsProps = {
  rules: RecurringRule[];
  today: BusinessDay;
  pageInfo: { page: number; pageSize: number; totalItems: number };
  refreshing: boolean;
  onOpen: (rule: RecurringRule) => void;
  onDelete: (rule: RecurringRule) => void;
  onPageChange: (page: number) => void;
};

/** RecurringBlockedSlotsTable: a table from 900px (every column from 1400px), cards under it. */
export function RecurringRulesRows({
  rules,
  today,
  pageInfo,
  refreshing,
  onOpen,
  onDelete,
  onPageChange,
}: RowsProps) {
  const intl = useIntl();
  const { compact } = useListLayout();
  const pagination = (
    <Pagination
      {...pageInfo}
      labels={paginationLabels(intl)}
      onPageChange={onPageChange}
      embedded={!compact}
    />
  );
  return (
    <RefreshOverlay refreshing={refreshing}>
      {compact ? (
        <div className="flex flex-col">
          <ul className="flex flex-col gap-3">
            {rules.map((rule) => (
              <li key={rule.id}>
                <RuleCard rule={rule} today={today} onOpen={onOpen} onDelete={onDelete} />
              </li>
            ))}
          </ul>
          <div className="mt-4">{pagination}</div>
        </div>
      ) : (
        <RulesTable rules={rules} today={today} onOpen={onOpen} onDelete={onDelete} footer={pagination} />
      )}
    </RefreshOverlay>
  );
}

type TableProps = Pick<RowsProps, 'rules' | 'today' | 'onOpen' | 'onDelete'> & { footer: React.ReactNode };

function RulesTable({ rules, today, onOpen, onDelete, footer }: TableProps) {
  const intl = useIntl();
  const [ref, width] = useElementWidth();
  const full = (width ?? 0) >= 1400;

  const columns = useMemo((): DataTableColumn<RecurringRule>[] => {
    const text = textOf(intl);
    const secondary = (value: string, lines = 1) => (
      <span
        className={
          lines === 1 ? 'block truncate text-muted-foreground' : 'line-clamp-2 text-muted-foreground'
        }
      >
        {value}
      </span>
    );
    const day: DataTableColumn<RecurringRule> = {
      id: 'day',
      header: text('availabilityFieldDay'),
      initialWidth: 140,
      minWidth: 120,
      grow: 2,
      cell: (rule) => (
        <span className="block truncate font-bold text-foreground">{weekdayName(intl, rule.weekday)}</span>
      ),
    };
    const status: DataTableColumn<RecurringRule> = {
      id: 'status',
      header: text('appointmentTableStatusColumn'),
      fixedWidth: 110,
      cell: (rule) => (
        <StatusPill
          label={text(
            rule.isActive
              ? 'scheduleRecurringStatusActiveSingular'
              : 'scheduleRecurringStatusInactiveSingular',
          )}
          tone={rule.isActive ? 'success' : 'neutral'}
        />
      ),
    };
    const actions: DataTableColumn<RecurringRule> = {
      id: 'actions',
      header: text('appointmentTableActionsColumn'),
      fixedWidth: 176,
      align: 'center',
      interactive: true,
      cell: (rule) => (
        <span className="inline-flex gap-2">
          <TableAction
            icon="visibility_outlined"
            label={text('scheduleRecurringBlockedSlotViewDetailTooltip')}
            onClick={() => {
              onOpen(rule);
            }}
          />
          <TableAction
            icon="delete_outline"
            tone="danger"
            label={text('adminCommonDelete')}
            onClick={() => {
              onDelete(rule);
            }}
          />
        </span>
      ),
    };
    if (!full) {
      return [
        day,
        {
          id: 'details',
          header: text('scheduleRecurringBlockedSlotTableDetails'),
          initialWidth: 300,
          minWidth: 220,
          grow: 4,
          cell: (rule) => secondary(`${ruleTimeRange(rule)} · ${ruleReasonText(intl, rule)}`),
        },
        status,
        actions,
      ];
    }
    return [
      day,
      {
        id: 'time',
        header: text('scheduleBlockedSlotTableSchedule'),
        initialWidth: 150,
        minWidth: 130,
        grow: 2,
        cell: (rule) => secondary(ruleTimeRange(rule)),
      },
      {
        id: 'reason',
        header: text('scheduleFieldReason'),
        initialWidth: 260,
        minWidth: 200,
        grow: 3,
        cell: (rule) => secondary(ruleReasonText(intl, rule), 2),
      },
      status,
      {
        id: 'next',
        header: text('scheduleRecurringBlockedSlotTableNextApplication'),
        initialWidth: 190,
        minWidth: 160,
        grow: 2,
        cell: (rule) => secondary(nextOccurrenceLabel(rule, today, localeOf(intl))),
      },
      actions,
    ];
  }, [intl, full, today, onOpen, onDelete]);

  return (
    <div ref={ref}>
      {width !== null && (
        <DataTable
          key={full ? 'full' : 'compact'}
          label={intl.formatMessage({ id: 'scheduleRecurringBlockedSlotsTitle' })}
          columns={columns}
          rows={rules}
          getRowId={(rule) => rule.id}
          onRowClick={onOpen}
          rowLabel={(rule) => `${weekdayName(intl, rule.weekday)} ${ruleTimeRange(rule)}`}
          resizable={full}
          footer={footer}
        />
      )}
    </div>
  );
}

type CardProps = Pick<RowsProps, 'today' | 'onOpen' | 'onDelete'> & { rule: RecurringRule };

/** RecurringBlockedSlotCard: weekday and status, hours, reason, next application, view and delete. */
function RuleCard({ rule, today, onOpen, onDelete }: CardProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const title = weekdayName(intl, rule.weekday);
  return (
    <article className="relative rounded-xl border border-border bg-card p-4 hover:bg-muted">
      <button
        type="button"
        aria-label={title}
        onClick={() => {
          onOpen(rule);
        }}
        className="absolute inset-0 cursor-pointer rounded-xl"
      />
      <div className="pointer-events-none relative">
        <div className="flex items-center gap-3">
          <h2 className="min-w-0 flex-1 text-heading text-foreground">{title}</h2>
          <StatusPill
            label={text(
              rule.isActive
                ? 'scheduleRecurringStatusActiveSingular'
                : 'scheduleRecurringStatusInactiveSingular',
            )}
            tone={rule.isActive ? 'success' : 'neutral'}
          />
        </div>
        <p className="mt-3 text-body-strong text-foreground">{ruleTimeRange(rule)}</p>
        <p className="mt-3 text-body text-muted-foreground">{ruleReasonText(intl, rule)}</p>
        <p className="mt-3 text-body text-muted-foreground">
          {[
            text('scheduleRecurringBlockedSlotNextApplicationPrefix'),
            nextOccurrenceLabel(rule, today, localeOf(intl)),
          ].join(' ')}
        </p>
      </div>
      <div className="relative z-10 mt-4 flex flex-wrap gap-1">
        <InlineAction
          compact
          icon="visibility_outlined"
          label={text('scheduleActionView')}
          onClick={() => {
            onOpen(rule);
          }}
        />
        <InlineAction
          compact
          icon="delete_outline"
          tone="danger"
          label={text('adminCommonDelete')}
          onClick={() => {
            onDelete(rule);
          }}
        />
      </div>
    </article>
  );
}
