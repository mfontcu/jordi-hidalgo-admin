import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { dateRangeDialogLabels, useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatDay, formatInstant } from '@/shared/lib/business-time';
import { dateRangeLabel, type DateFilter } from '@/shared/lib/date-filter';
import {
  Button,
  ConfirmDialog,
  DateFilterField,
  EmptyState,
  FilterPicker,
  ListPage,
  RemovableChip,
  SearchField,
  showErrorToast,
  Spinner,
  StatCard,
  SummaryGrid,
  ToolbarField,
  useListLayout,
} from '@/shared/ui';

import { useBlockedSlotsList } from '../../hooks/use-blocked-slots-list';
import { nextBlockedSlot, type BlockedSlotPage } from '../../model/blocked-slot';
import { BLOCKED_SLOT_DATE_PICKS, type BlockedSlotTypeFilter } from '../../model/blocked-slots-search';
import { localeOf, textOf } from '../shared/labels';
import { BlockedSlotsRows } from './blocked-slots-rows';

type List = ReturnType<typeof useBlockedSlotsList>;

/** The punctual tab (`_BlockedSlotsContent`): summary, search and filters, and the blocks. */
export function PunctualSlotsSection({ tabs }: { tabs: ReactNode }) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const list = useBlockedSlotsList({
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });

  return (
    <ListPage
      title={text('scheduleBlockedSlotsTitle')}
      subtitle={text('scheduleBlockedSlotsSubtitle')}
      beforeSummary={tabs}
      summaryLabel={text('adminSummaryTitle')}
      summary={<Summary page={list.page} />}
      toolbar={<Toolbar list={list} />}
    >
      {list.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={36} className="text-primary" />
        </div>
      ) : list.error ? (
        <EmptyState
          icon="error_outline"
          title={text('scheduleBlockedSlotsLoadError')}
          message={describeFailure(list.error)}
          action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: list.retry }}
        />
      ) : !list.page || list.page.items.length === 0 ? (
        <EmptyState
          icon="block_outlined"
          title={text('scheduleBlockedSlotsEmptyTitle')}
          message={text('scheduleBlockedSlotsEmptyMessage')}
          action={{ label: text('scheduleBlockedSlotsEmptyAction'), onClick: list.create }}
        />
      ) : (
        <BlockedSlotsRows
          page={list.page}
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
        title={text('scheduleBlockedSlotDeleteTitle')}
        message={text('scheduleBlockedSlotDeleteMessage')}
        cancelLabel={text('adminCommonCancel')}
        confirmLabel={text('adminCommonDelete')}
        onConfirm={list.confirmDelete}
      />
    </ListPage>
  );
}

function Summary({ page }: { page: BlockedSlotPage | undefined }) {
  const intl = useIntl();
  const text = textOf(intl);
  const next = page ? nextBlockedSlot(page) : null;
  const card = (key: 'Active' | 'FullDays' | 'Ranges' | 'Next', value: string) => (
    <StatCard
      title={text(`scheduleBlockedSlotsSummary${key}Title`)}
      value={value}
      subtitle={text(`scheduleBlockedSlotsSummary${key}Subtitle`)}
    />
  );
  return (
    <SummaryGrid count={4}>
      {card('Active', String(page?.summary.activeBlocks ?? 0))}
      {card('FullDays', String(page?.summary.fullDayClosures ?? 0))}
      {card('Ranges', String(page?.summary.partialRanges ?? 0))}
      {/* formatScheduleShortDate: `d MMM`. */}
      {card('Next', next ? formatInstant(next.startAt, localeOf(intl), 'dayMonth') : '-')}
    </SummaryGrid>
  );
}

const DATE_LABELS: Record<(typeof BLOCKED_SLOT_DATE_PICKS)[number], MessageId> = {
  all: 'scheduleBlockedSlotDateAll',
  today: 'appointmentDateToday',
  next7Days: 'scheduleBlockedSlotDateNext7Days',
  month: 'adminCommonThisMonth',
  nextMonth: 'scheduleBlockedSlotDateNextMonth',
  custom: 'clientDateCustomRange',
};

const TYPE_LABELS: Record<BlockedSlotTypeFilter, MessageId> = {
  all: 'scheduleBlockedSlotFilterAll',
  fullDay: 'scheduleBlockedSlotTypeFullDay',
  range: 'scheduleBlockedSlotTypeRange',
};

/** blockedSlotDatePresetLabel, or the range as `d MMM · d MMM` (blockedSlotDateRangeToolbarLabel). */
function dateLabelOf(
  text: (id: MessageId) => string,
  filter: DateFilter,
  locale: ReturnType<typeof localeOf>,
) {
  if (filter.kind === 'range') return dateRangeLabel(filter.from, filter.to, locale, 'dayMonth');
  return filter.kind in DATE_LABELS
    ? text(DATE_LABELS[filter.kind as keyof typeof DATE_LABELS])
    : text('appointmentDateToday');
}

/** BlockedSlotsToolbar: search, date, type, and new block in a row; stacked on compact layouts. */
function Toolbar({ list }: { list: List }) {
  const intl = useIntl();
  const text = textOf(intl);
  const locale = localeOf(intl);
  const { compact } = useListLayout();
  const grow = compact ? 'w-full' : 'min-w-0 flex-1';
  const dateLabel = dateLabelOf(text, list.dateFilter, locale);
  const typeLabel = text(TYPE_LABELS[list.typeFilter]);

  const search = (
    <SearchField
      value={list.searchText}
      onValueChange={list.setSearchText}
      placeholder={text('scheduleBlockedSlotsSearchHint')}
      aria-label={text('scheduleBlockedSlotsSearchHint')}
      clearLabel={text('adminCommonClearSearch')}
      className={grow}
    />
  );
  const date = (
    <DateFilterField
      compact={compact}
      className="w-full"
      label={dateLabel}
      title={text('scheduleBlockedSlotDateFilterTitle')}
      subtitle={text('scheduleBlockedSlotDateFilterSubtitle')}
      options={BLOCKED_SLOT_DATE_PICKS.map((pick) => ({
        value: pick,
        icon: pick === 'custom' ? 'event_outlined' : 'calendar_today_outlined',
        label: text(DATE_LABELS[pick]),
      }))}
      onPick={list.pickDate}
      rangeOpen={list.rangeOpen}
      onRangeOpenChange={list.setRangeOpen}
      range={list.dateRange}
      today={list.today}
      language={locale}
      rangeLabels={dateRangeDialogLabels(intl)}
      formatDay={(day) => formatDay(day, locale, 'listDate')}
      onApplyRange={list.applyRange}
    />
  );
  const type = (
    <FilterPicker<BlockedSlotTypeFilter>
      compact={compact}
      trigger={<ToolbarField icon="tune_rounded" label={typeLabel} className="w-full" />}
      title={text('scheduleBlockedSlotFilterTitle')}
      subtitle={text('scheduleBlockedSlotFilterSubtitle')}
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={(['all', 'fullDay', 'range'] as const).map((value) => ({
        value,
        label: text(TYPE_LABELS[value]),
      }))}
      value={list.typeFilter}
      clearValue="all"
      onApply={list.applyType}
    />
  );
  const create = (
    <Button icon="add" onClick={list.create} className={compact ? 'h-12 w-full' : 'h-12 shrink-0'}>
      {text('scheduleBlockedSlotNew')}
    </Button>
  );

  const chips = [
    list.dateFilter.kind !== 'all' && { label: dateLabel, onRemove: list.clearDate },
    list.typeFilter !== 'all' && { label: typeLabel, onRemove: list.clearType },
  ].filter((chip) => chip !== false);

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {search}
          {date}
          {type}
          {create}
        </>
      ) : (
        <div className="flex items-center gap-3">
          {search}
          <div className={grow}>{date}</div>
          <div className={grow}>{type}</div>
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
