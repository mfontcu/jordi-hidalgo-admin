import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { compareDays, type BusinessDay } from '@/shared/lib/business-time';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FilterPicker,
  ListPage,
  PromptDialog,
  RemovableChip,
  SearchField,
  Spinner,
  StatCard,
  SummaryGrid,
  ToolbarField,
  showErrorToast,
  showToast,
  useListLayout,
} from '@/shared/ui';

import { useAppointmentsList } from '../hooks/use-appointments-list';
import { APPOINTMENT_STATUSES, type AppointmentStatusFilter } from '../model/appointments-search';
import type { AppointmentItem } from '../model/appointment';
import { AppointmentsDateFilterField } from './appointments-date-filter-field';
import { AppointmentsRows } from './appointments-rows';

type AppointmentsList = ReturnType<typeof useAppointmentsList>;

type RowDialog = { kind: 'complete' | 'noShow' | 'cancel'; item: AppointmentItem };

type BulkPartial = { failed: { id: string; error: unknown }[]; attempted: number };

const STATUS_LABELS: Record<AppointmentStatusFilter, MessageId> = {
  all: 'appointmentFilterAll',
  pending: 'appointmentFilterPending',
  confirmed: 'appointmentFilterConfirmed',
  completed: 'appointmentFilterCompleted',
  cancelled: 'appointmentFilterCancelled',
  no_show: 'appointmentFilterNoShow',
};

/** `/appointments` (AppointmentScreen): summary, filters, bulk actions, and the list. */
export function AppointmentsScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const [rowDialog, setRowDialog] = useState<RowDialog | null>(null);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [bulkPartial, setBulkPartial] = useState<BulkPartial | null>(null);
  const bulkAttemptedRef = useRef(0);

  const list = useAppointmentsList({
    onSuccess: (message) => showToast(intl.formatMessage({ id: message })),
    onError: (error, context) => showErrorToast(describeFailure(error, context)),
    onTooEarly: (message) => showErrorToast(intl.formatMessage({ id: message })),
    onBulkPartial: (failed) => {
      setBulkPartial({ failed, attempted: bulkAttemptedRef.current });
    },
  });

  const hasItems = (list.page?.items.length ?? 0) > 0;
  const selectableCount = list.selectableOnPage.length;
  const allPageSelected =
    selectableCount > 0 && list.selectableOnPage.every((item) => list.selectedIds.has(item.id));

  const actions = {
    open: list.open,
    complete: (item: AppointmentItem) => {
      setRowDialog({ kind: 'complete', item });
    },
    markNoShow: (item: AppointmentItem) => {
      setRowDialog({ kind: 'noShow', item });
    },
    cancel: (item: AppointmentItem) => {
      setRowDialog({ kind: 'cancel', item });
    },
  };

  const runBulk = (action: 'completed' | 'no_show') => {
    if (list.selectedIds.size === 0) return;
    bulkAttemptedRef.current = list.selectedIds.size;
    setBulkPartial(null);
    if (action === 'completed') list.bulkComplete();
    else list.bulkNoShow();
  };

  const runBulkCancel = (reason: string) => {
    bulkAttemptedRef.current = list.selectedIds.size;
    setBulkPartial(null);
    list.bulkCancel(reason);
  };

  return (
    <>
      <ListPage
        title={intl.formatMessage({ id: 'appointmentListTitle' })}
        subtitle={intl.formatMessage({ id: 'appointmentListSubtitle' })}
        summaryLabel={intl.formatMessage({ id: 'adminSummaryTitle' })}
        summary={<AppointmentsSummary list={list} />}
        toolbar={
          <AppointmentsToolbar
            list={list}
            hasItems={hasItems}
            allPageSelected={allPageSelected}
            onBulkComplete={() => {
              runBulk('completed');
            }}
            onBulkNoShow={() => {
              runBulk('no_show');
            }}
            onBulkCancel={() => {
              setBulkCancelOpen(true);
            }}
          />
        }
      >
        {list.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={36} className="text-primary" />
          </div>
        ) : list.error ? (
          <EmptyState
            icon="error_outline"
            title={intl.formatMessage({ id: 'appointmentListLoadError' })}
            message={describeFailure(list.error)}
            action={{
              label: intl.formatMessage({ id: 'adminCommonRetry' }),
              icon: 'refresh',
              onClick: list.retry,
            }}
          />
        ) : !list.page || list.page.items.length === 0 ? (
          <EmptyState
            icon="event_busy_outlined"
            title={intl.formatMessage({ id: 'appointmentEmptyTitle' })}
            message={intl.formatMessage({ id: 'appointmentEmptyMessage' })}
            action={{
              label: intl.formatMessage({ id: 'appointmentNewButton' }),
              onClick: list.newAppointment,
            }}
          />
        ) : (
          <AppointmentsRows
            page={list.page}
            refreshing={list.isRefreshing || list.isBusy}
            selectMode={list.selectMode}
            selectedIds={list.selectedIds}
            onToggleSelected={list.toggleSelected}
            onPageChange={list.goToPage}
            actions={actions}
          />
        )}
      </ListPage>

      {rowDialog?.kind === 'complete' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setRowDialog(null);
          }}
          title={intl.formatMessage({ id: 'appointmentCompleteTitle' })}
          message={intl.formatMessage(
            { id: 'appointmentCompleteBody' },
            {
              customerName: rowDialog.item.customerName || intl.formatMessage({ id: 'appointmentNoClient' }),
            },
          )}
          confirmLabel={intl.formatMessage({ id: 'appointmentCompleteConfirm' })}
          cancelLabel={intl.formatMessage({ id: 'adminCommonCancel' })}
          tone="emphasized"
          onConfirm={() => {
            list.complete(rowDialog.item);
          }}
        />
      )}
      {rowDialog?.kind === 'noShow' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setRowDialog(null);
          }}
          title={intl.formatMessage({ id: 'appointmentNoShowTitle' })}
          message={intl.formatMessage(
            { id: 'appointmentNoShowBody' },
            {
              customerName: rowDialog.item.customerName || intl.formatMessage({ id: 'appointmentNoClient' }),
            },
          )}
          confirmLabel={intl.formatMessage({ id: 'appointmentNoShowConfirm' })}
          cancelLabel={intl.formatMessage({ id: 'adminCommonCancel' })}
          onConfirm={() => {
            list.markNoShow(rowDialog.item);
          }}
        />
      )}
      {rowDialog?.kind === 'cancel' && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setRowDialog(null);
          }}
          title={intl.formatMessage({ id: 'appointmentCancelTitle' })}
          message={intl.formatMessage({ id: 'appointmentCancelBody' })}
          confirmLabel={intl.formatMessage({ id: 'appointmentCancelConfirm' })}
          cancelLabel={intl.formatMessage({ id: 'adminCommonCancel' })}
          onConfirm={() => {
            list.cancel(rowDialog.item);
          }}
        />
      )}

      <PromptDialog
        open={bulkCancelOpen}
        onOpenChange={setBulkCancelOpen}
        title={intl.formatMessage({ id: 'appointmentBulkCancelTitle' })}
        message={intl.formatMessage({ id: 'appointmentBulkCancelBody' }, { count: list.selectedIds.size })}
        fieldLabel={intl.formatMessage({ id: 'appointmentBulkCancelReasonLabel' })}
        confirmLabel={intl.formatMessage({ id: 'appointmentBulkCancelConfirm' })}
        cancelLabel={intl.formatMessage({ id: 'appointmentBulkCancelAction' })}
        onConfirm={runBulkCancel}
      />

      {bulkPartial && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setBulkPartial(null);
          }}
          title={intl.formatMessage({ id: 'appointmentBulkPartialFailureTitle' })}
          message={intl.formatMessage(
            { id: 'appointmentBulkPartialFailureSummary' },
            {
              success: Math.max(0, bulkPartial.attempted - bulkPartial.failed.length),
              failed: bulkPartial.failed.length,
            },
          )}
          confirmLabel={intl.formatMessage({ id: 'appointmentBulkFailureClose' })}
          cancelLabel={intl.formatMessage({ id: 'adminCommonCancel' })}
          tone="emphasized"
          onConfirm={() => {
            setBulkPartial(null);
          }}
        >
          <ul className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto text-left text-[14px] leading-[1.4] text-content-secondary">
            {bulkPartial.failed.map(({ id, error }) => (
              <li key={id}>{[id, describeFailure(error)].join(' — ')}</li>
            ))}
          </ul>
        </ConfirmDialog>
      )}
    </>
  );
}

function AppointmentsSummary({ list }: { list: AppointmentsList }) {
  const intl = useIntl();
  const summary = list.page?.summary;
  const filtersActive = list.filtersActive;

  const totalValue = filtersActive ? (list.page?.totalItems ?? 0) : (summary?.totalToday ?? 0);
  const totalTitle = filtersActive ? 'appointmentStatTotal' : 'appointmentStatTotalToday';
  const totalSubtitle = filtersActive ? 'appointmentStatAccordingToFilters' : 'appointmentStatScheduledToday';

  const freeSlotsSubtitle = freeSlotsSubtitleOf(list.dateFilter, list.today);

  const cards = [
    <StatCard
      key="total"
      title={intl.formatMessage({ id: totalTitle })}
      value={String(totalValue)}
      subtitle={intl.formatMessage({ id: totalSubtitle })}
    />,
    summary ? (
      <StatCard
        key="free"
        title={intl.formatMessage({ id: 'appointmentSummaryFreeSlots' })}
        value={String(summary.freeSlots)}
        subtitle={intl.formatMessage({ id: freeSlotsSubtitle })}
      />
    ) : null,
    <StatCard
      key="pending"
      title={intl.formatMessage({ id: 'appointmentFilterPending' })}
      value={String(summary?.pending ?? 0)}
      subtitle={intl.formatMessage({ id: 'appointmentSummaryPendingSubtitle' })}
    />,
    <StatCard
      key="completed"
      title={intl.formatMessage({ id: 'appointmentFilterCompleted' })}
      value={String(summary?.completed ?? 0)}
      subtitle={intl.formatMessage({ id: 'appointmentSummaryCompletedSubtitle' })}
    />,
    <StatCard
      key="cancelled"
      title={intl.formatMessage({ id: 'appointmentFilterCancelled' })}
      value={String(summary?.cancelled ?? 0)}
      subtitle={intl.formatMessage({ id: 'appointmentSummaryCancelledSubtitle' })}
    />,
    <StatCard
      key="noShow"
      title={intl.formatMessage({ id: 'appointmentSummaryNoShow' })}
      value={String(summary?.noShow ?? 0)}
      subtitle={intl.formatMessage({ id: 'appointmentSummaryNoShowSubtitle' })}
    />,
    <StatCard
      key="rescheduled"
      title={intl.formatMessage({ id: 'appointmentSummaryRescheduled' })}
      value={String(summary?.rescheduled ?? 0)}
      subtitle={intl.formatMessage({ id: 'appointmentSummaryRescheduledSubtitle' })}
    />,
  ].filter(Boolean);

  return <SummaryGrid count={cards.length}>{cards}</SummaryGrid>;
}

function freeSlotsSubtitleOf(filter: AppointmentsList['dateFilter'], today: BusinessDay): MessageId {
  if (filter.kind === 'today') return 'appointmentSummaryFreeSlotsTodaySubtitle';
  if (filter.kind === 'range') {
    const start = filter.from;
    const end = filter.to;
    if (compareDays(start, today) === 0 && compareDays(end, today) === 0) {
      return 'appointmentSummaryFreeSlotsTodaySubtitle';
    }
  }
  return 'appointmentSummaryFreeSlotsSubtitle';
}

function AppointmentsToolbar({
  list,
  hasItems,
  allPageSelected,
  onBulkComplete,
  onBulkNoShow,
  onBulkCancel,
}: {
  list: AppointmentsList;
  hasItems: boolean;
  allPageSelected: boolean;
  onBulkComplete: () => void;
  onBulkNoShow: () => void;
  onBulkCancel: () => void;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const { compact } = useListLayout();
  const fieldWidth = compact ? 'w-full' : 'w-[148px]';

  const statusFilter = list.statusFilter;
  const filterLabel = text(STATUS_LABELS[statusFilter]);
  const statusOptions: { value: AppointmentStatusFilter; label: string }[] = [
    { value: 'all', label: text('appointmentFilterAll') },
    ...APPOINTMENT_STATUSES.map((status) => ({ value: status, label: text(STATUS_LABELS[status]) })),
  ];

  const search = (
    <SearchField
      value={list.searchText}
      onValueChange={list.setSearchText}
      placeholder={text('appointmentListSearchHint')}
      aria-label={text('appointmentListSearchHint')}
      clearLabel={text('adminCommonClearSearch')}
      className={compact ? undefined : 'min-w-0 flex-1'}
    />
  );
  const date = (
    <AppointmentsDateFilterField
      compact={compact}
      className={fieldWidth}
      filter={list.dateFilter}
      today={list.today}
      range={list.dateRange}
      onPick={list.pickDate}
      rangeOpen={list.rangeOpen}
      onRangeOpenChange={list.setRangeOpen}
      onApplyRange={list.applyRange}
    />
  );
  const filter = (
    <FilterPicker
      compact={compact}
      trigger={<ToolbarField icon="tune_rounded" label={filterLabel} className={fieldWidth} />}
      title={text('appointmentFilterTitle')}
      subtitle={text('appointmentFilterSubtitle')}
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={statusOptions}
      value={statusFilter}
      clearValue="all"
      onApply={list.applyStatus}
    />
  );
  const newButton = (
    <Button icon="add" onClick={list.newAppointment} className={compact ? 'h-12 w-full' : 'h-12'}>
      {text('appointmentNewButton')}
    </Button>
  );

  const selectField = hasItems ? (
    <ToolbarField
      icon={list.selectMode ? 'check_box_outlined' : 'check_box_outline_blank'}
      label={text(list.selectMode ? 'appointmentBulkExitSelectMode' : 'appointmentBulkSelectMode')}
      className={compact ? 'w-full' : undefined}
      onClick={() => {
        if (list.selectMode) list.exitSelectMode();
        else list.enterSelectMode();
      }}
    />
  ) : null;

  const selectedCount = list.selectedIds.size;
  const bulkBar = list.selectMode ? (
    <div
      className={
        compact
          ? 'flex flex-col gap-2 rounded-md border border-outline-variant bg-surface-muted p-3'
          : 'flex flex-wrap items-center gap-2 rounded-md border border-outline-variant bg-surface-muted p-3'
      }
    >
      <p className="min-w-0 flex-1 text-[14px] font-bold text-on-surface">
        {intl.formatMessage({ id: 'appointmentBulkSelectedCount' }, { count: selectedCount })}
      </p>
      {selectedCount === 0 && list.selectableOnPage.length === 0 && (
        <p className="w-full text-[13px] text-content-secondary">
          {text('appointmentBulkNoSelectableItems')}
        </p>
      )}
      <Button
        variant="secondary"
        disabled={list.selectableOnPage.length === 0}
        onClick={() => {
          if (allPageSelected) list.clearSelection();
          else list.selectAllPage();
        }}
      >
        {text(allPageSelected ? 'appointmentBulkClearSelection' : 'appointmentBulkSelectAllPage')}
      </Button>
      <Button variant="secondary" disabled={selectedCount === 0 || list.isBusy} onClick={onBulkComplete}>
        {text('appointmentBulkCompleteAction')}
      </Button>
      <Button variant="secondary" disabled={selectedCount === 0 || list.isBusy} onClick={onBulkNoShow}>
        {text('appointmentBulkNoShowAction')}
      </Button>
      <Button variant="dangerTonal" disabled={selectedCount === 0 || list.isBusy} onClick={onBulkCancel}>
        {text('appointmentBulkCancelSelectedAction')}
      </Button>
    </div>
  ) : null;

  const statusChip =
    statusFilter !== 'all' ? (
      <RemovableChip
        label={filterLabel}
        removeLabel={intl.formatMessage({ id: 'adminFilterRemove' }, { filter: filterLabel })}
        onRemove={list.clearStatus}
      />
    ) : null;

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {search}
          {date}
          {filter}
          {newButton}
          {selectField}
        </>
      ) : (
        <div className="flex items-center gap-3">
          {search}
          {date}
          {filter}
          {newButton}
        </div>
      )}
      {!compact && selectField && <div>{selectField}</div>}
      {bulkBar}
      {statusChip && <div>{statusChip}</div>}
    </div>
  );
}
