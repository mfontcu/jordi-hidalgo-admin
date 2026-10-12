import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, useLocaleStore, type MessageId } from '@/shared/i18n';
import {
  addDays,
  businessToday,
  compareDays,
  dateToDay,
  dayToDate,
  formatDay,
  type BusinessDay,
} from '@/shared/lib/business-time';
import {
  ActionPicker,
  Button,
  Calendar,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  FilterPicker,
  ListPage,
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

import { useSlotWatches } from '../hooks/use-slot-watches';
import type { SlotWatch } from '../model/slot-watch';
import { SlotWatchDetailSheet } from './slot-watch-detail-sheet';
import { SlotWatchRows } from './slot-watches-rows';

type SlotWatchList = ReturnType<typeof useSlotWatches>;

/** `/schedule/slot-watches` (SlotWatchDemandScreen). */
export function SlotWatchesScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const list = useSlotWatches({
    onCancelled: () => {
      showToast(text('slotWatchAdminCancelled'));
    },
    onCancelError: (error) => {
      showErrorToast(describeFailure(error, 'slotWatchAdminCancelError'));
    },
  });
  const [openWatch, setOpenWatch] = useState<SlotWatch | null>(null);
  const [cancelWatch, setCancelWatch] = useState<SlotWatch | null>(null);
  const [pickingDay, setPickingDay] = useState(false);

  const askCancel = (watch: SlotWatch) => {
    setOpenWatch(null);
    setCancelWatch(watch);
  };

  return (
    <ListPage
      title={text('slotWatchAdminTitle')}
      subtitle={text('slotWatchAdminSubtitle')}
      summaryLabel={text('adminSummaryTitle')}
      summary={<SlotWatchSummary list={list} />}
      toolbar={
        <SlotWatchToolbar
          list={list}
          onPickDay={() => {
            setPickingDay(true);
          }}
        />
      }
    >
      <SlotWatchBody list={list} onOpen={setOpenWatch} onCancel={askCancel} />
      <SlotWatchDetailSheet
        watch={openWatch}
        onOpenChange={(open) => {
          if (!open) setOpenWatch(null);
        }}
        onClient={(watch) => {
          list.openClient(watch.userId);
        }}
        onAppointment={(watch) => {
          list.openAppointment(watch.linkedAppointmentId);
        }}
        onCancel={askCancel}
      />
      <ConfirmDialog
        open={cancelWatch !== null}
        onOpenChange={(open) => {
          if (!open) setCancelWatch(null);
        }}
        title={text('slotWatchAdminCancelTitle')}
        message={text(
          cancelWatch?.status === 'held' ? 'slotWatchAdminCancelHeldMessage' : 'slotWatchAdminCancelMessage',
        )}
        confirmLabel={text('slotWatchAdminCancelConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={() => {
          if (cancelWatch) list.cancel(cancelWatch.id);
        }}
      />
      <DayDialog
        open={pickingDay}
        initial={list.date ?? businessToday()}
        onOpenChange={setPickingDay}
        onApply={(day) => {
          list.setDate(day);
        }}
      />
    </ListPage>
  );
}

function SlotWatchSummary({ list }: { list: SlotWatchList }) {
  const intl = useIntl();
  const card = (title: MessageId, value: number, subtitle: MessageId) => (
    <StatCard
      title={intl.formatMessage({ id: title })}
      value={String(value)}
      subtitle={intl.formatMessage({ id: subtitle })}
    />
  );
  return (
    <SummaryGrid count={4}>
      {card('slotWatchAdminActiveCount', list.counts.active, 'slotWatchAdminActiveSubtitle')}
      {card('slotWatchAdminHeldCount', list.counts.held, 'slotWatchAdminHeldSubtitle')}
      {card('slotWatchAdminUpgradeCount', list.counts.upgrades, 'slotWatchAdminUpgradeSubtitle')}
      {card('slotWatchAdminExpiringCount', list.counts.expiringSoon, 'slotWatchAdminExpiringSubtitle')}
    </SummaryGrid>
  );
}

function SlotWatchToolbar({ list, onPickDay }: { list: SlotWatchList; onPickDay: () => void }) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const { compact } = useListLayout();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const dateLabel = list.date ? formatDay(list.date, locale, 'numericDate') : text('slotWatchAdminDateAll');
  const serviceLabel =
    list.services.find((service) => service.id === list.serviceId)?.name ??
    list.serviceId ??
    text('slotWatchAdminServiceAll');
  const statusLabel = text(
    list.status === 'active'
      ? 'slotWatchAdminStatusActive'
      : list.status === 'held'
        ? 'slotWatchAdminStatusHeld'
        : 'slotWatchAdminStatusAll',
  );

  const search = (
    <SearchField
      value={list.searchText}
      onValueChange={list.setSearchText}
      placeholder={text('slotWatchAdminSearchHint')}
      aria-label={text('slotWatchAdminSearchHint')}
      clearLabel={text('adminCommonClearSearch')}
      className={compact ? undefined : 'min-w-0 flex-[2]'}
    />
  );
  const date = (
    <ActionPicker
      compact={compact}
      trigger={
        <ToolbarField
          icon="calendar_today_outlined"
          label={dateLabel}
          className={compact ? 'w-full' : 'min-w-0 flex-1'}
        />
      }
      title={text('slotWatchAdminDateFilterTitle')}
      subtitle={text('slotWatchAdminDateFilterSubtitle')}
      options={[
        { value: 'all', icon: 'all_inclusive_rounded', label: text('slotWatchAdminDateAll') },
        { value: 'day', icon: 'event_outlined', label: text('slotWatchAdminDatePickDay') },
      ]}
      onPick={(value) => {
        if (value === 'all') list.setDate(null);
        else onPickDay();
      }}
    />
  );
  const service = (
    <FilterPicker
      compact={compact}
      trigger={
        <ToolbarField
          icon="content_cut_rounded"
          label={serviceLabel}
          className={compact ? 'w-full' : 'min-w-0 flex-1'}
        />
      }
      title={text('slotWatchAdminServiceFilterTitle')}
      subtitle={text('slotWatchAdminServiceFilterSubtitle')}
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={[
        { value: 'all', label: text('slotWatchAdminServiceAll') },
        ...list.services.map((item) => ({ value: item.id, label: item.name })),
      ]}
      value={list.serviceId ?? 'all'}
      clearValue="all"
      onApply={(value) => {
        list.setService(value === 'all' ? null : value);
      }}
    />
  );
  const status = (
    <FilterPicker
      compact={compact}
      trigger={
        <ToolbarField
          icon="tune_rounded"
          label={statusLabel}
          className={compact ? 'w-full' : 'min-w-0 flex-1'}
        />
      }
      title={text('slotWatchAdminStatusFilterTitle')}
      subtitle={text('slotWatchAdminStatusFilterSubtitle')}
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={[
        { value: 'all', label: text('slotWatchAdminStatusAll') },
        { value: 'active', label: text('slotWatchAdminStatusActive') },
        { value: 'held', label: text('slotWatchAdminStatusHeld') },
      ]}
      value={list.status ?? 'all'}
      clearValue="all"
      onApply={(value) => {
        list.setStatus(value === 'all' ? null : value);
      }}
    />
  );
  const refresh = (
    <Button
      variant="secondary"
      icon="refresh"
      onClick={list.refresh}
      disabled={list.isLoading || list.isRefreshing}
      className={compact ? 'h-12 w-full' : 'h-12'}
    >
      {text('adminCommonRefresh')}
    </Button>
  );

  const chips = (
    <div className="flex flex-wrap gap-2">
      {list.date && (
        <RemovableChip
          label={dateLabel}
          removeLabel={intl.formatMessage({ id: 'adminFilterRemove' }, { filter: dateLabel })}
          onRemove={() => {
            list.setDate(null);
          }}
        />
      )}
      {list.serviceId && (
        <RemovableChip
          label={serviceLabel}
          removeLabel={intl.formatMessage({ id: 'adminFilterRemove' }, { filter: serviceLabel })}
          onRemove={() => {
            list.setService(null);
          }}
        />
      )}
      {list.status && (
        <RemovableChip
          label={statusLabel}
          removeLabel={intl.formatMessage({ id: 'adminFilterRemove' }, { filter: statusLabel })}
          onRemove={() => {
            list.setStatus(null);
          }}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {search}
          {date}
          {service}
          {status}
          {refresh}
        </>
      ) : (
        <div className="flex items-center gap-3">
          {search}
          {date}
          {service}
          {status}
          {refresh}
        </div>
      )}
      {(list.date ?? list.serviceId ?? list.status) && chips}
    </div>
  );
}

function SlotWatchBody({
  list,
  onOpen,
  onCancel,
}: {
  list: SlotWatchList;
  onOpen: (watch: SlotWatch) => void;
  onCancel: (watch: SlotWatch) => void;
}) {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const text = (id: MessageId) => intl.formatMessage({ id });
  if (list.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={36} className="text-primary" />
      </div>
    );
  }
  if (list.error && list.items.length === 0) {
    return (
      <EmptyState
        icon="error_outline"
        title={text('slotWatchAdminLoadError')}
        message={describeFailure(list.error)}
        action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: list.retry }}
      />
    );
  }
  if (list.total === 0) {
    const filtered =
      list.searchText.trim() !== '' || list.serviceId !== undefined || list.status !== undefined;
    const empty = filtered
      ? {
          title: 'slotWatchAdminEmptyFilteredTitle' as const,
          message: 'slotWatchAdminEmptyFilteredMessage' as const,
        }
      : list.date
        ? { title: 'slotWatchAdminEmptyTitle' as const, message: 'slotWatchAdminEmptyMessage' as const }
        : {
            title: 'slotWatchAdminEmptyAllTitle' as const,
            message: 'slotWatchAdminEmptyAllMessage' as const,
          };
    return (
      <EmptyState
        icon={filtered ? 'filter_alt_off_outlined' : 'notifications_active_outlined'}
        title={text(empty.title)}
        message={text(empty.message)}
      />
    );
  }
  return (
    <SlotWatchRows
      rows={list.rows}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      refreshing={list.isRefreshing}
      isCancelling={list.isCancelling}
      onOpen={onOpen}
      onClient={(watch) => {
        list.openClient(watch.userId);
      }}
      onCancel={onCancel}
      onPageChange={list.goToPage}
    />
  );
}

const DAY_RANGE_BEFORE = 1;
const DAY_RANGE_AFTER = 90;

function DayDialog({
  open,
  initial,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  initial: BusinessDay;
  onOpenChange: (open: boolean) => void;
  onApply: (day: BusinessDay) => void;
}) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const today = businessToday();
  const first = addDays(today, -DAY_RANGE_BEFORE);
  const last = addDays(today, DAY_RANGE_AFTER);
  const start = compareDays(initial, first) < 0 ? first : compareDays(initial, last) > 0 ? last : initial;
  const [selected, setSelected] = useState(start);
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) setSelected(start);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{intl.formatMessage({ id: 'slotWatchAdminDatePickDay' })}</DialogTitle>
        <Calendar
          mode="single"
          language={locale}
          selected={dayToDate(selected)}
          defaultMonth={dayToDate(selected)}
          startMonth={dayToDate(first)}
          endMonth={dayToDate(last)}
          disabled={{ before: dayToDate(first), after: dayToDate(last) }}
          onSelect={(day) => {
            if (day) setSelected(dateToDay(day));
          }}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {intl.formatMessage({ id: 'adminCommonCancel' })}
          </Button>
          <Button
            icon="check_rounded"
            onClick={() => {
              onApply(selected);
              onOpenChange(false);
            }}
          >
            {intl.formatMessage({ id: 'adminCommonApply' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
