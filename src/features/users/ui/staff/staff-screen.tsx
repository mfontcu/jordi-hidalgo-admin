import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatInstant, type DateLocale } from '@/shared/lib/business-time';
import {
  Button,
  EmptyState,
  FilterPicker,
  ListPage,
  RemovableChip,
  SearchField,
  Spinner,
  StatCard,
  SummaryGrid,
  ToolbarField,
  useListLayout,
} from '@/shared/ui';

import { useStaffList } from '../../hooks/use-staff-list';
import { activeCount, staffStatus, type AdminUser } from '../../model/admin-user';
import type { StaffFilter } from '../../model/staff-search';
import { DateFilterField, dateFilterLabel } from '../shared/date-filter-field';
import { UsersRows, type UserExtraColumn } from '../shared/users-rows';

type StaffList = ReturnType<typeof useStaffList>;

const listStatus = (user: AdminUser) => staffStatus(user, 'list');

/** `/admins` (StaffAdminsScreen): summary, search and filters, and the staff accounts. */
export function StaffScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const list = useStaffList();
  const locale = intl.locale as DateLocale;

  const extraColumns = useMemo(
    (): UserExtraColumn[] => [
      {
        header: intl.formatMessage({ id: 'staffColumnRegistered' }),
        value: (user) => formatInstant(user.createdAt, locale, 'listDate'),
      },
    ],
    [intl, locale],
  );

  return (
    <ListPage
      title={intl.formatMessage({ id: 'staffListTitle' })}
      subtitle={intl.formatMessage({ id: 'staffListSubtitle' })}
      summaryLabel={intl.formatMessage({ id: 'adminSummaryTitle' })}
      summary={<StaffSummary list={list} />}
      toolbar={<StaffToolbar list={list} />}
    >
      {list.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={36} className="text-primary" />
        </div>
      ) : list.error ? (
        <EmptyState
          icon="error_outline"
          title={intl.formatMessage({ id: 'staffLoadError' })}
          message={describeFailure(list.error)}
          action={{
            label: intl.formatMessage({ id: 'adminCommonRetry' }),
            icon: 'refresh',
            onClick: list.retry,
          }}
        />
      ) : !list.page || list.page.items.length === 0 ? (
        <EmptyState
          icon="admin_panel_settings_outlined"
          title={intl.formatMessage({ id: 'staffListEmptyTitle' })}
          message={intl.formatMessage({ id: 'staffListEmptyMessage' })}
          action={{ label: intl.formatMessage({ id: 'adminStaffNewButton' }), onClick: list.newStaff }}
        />
      ) : (
        <UsersRows
          page={list.page}
          refreshing={list.isRefreshing}
          nameHeader={intl.formatMessage({ id: 'staffColumnAdmin' })}
          extraColumns={extraColumns}
          status={listStatus}
          onOpen={list.openStaff}
          onPageChange={list.goToPage}
        />
      )}
    </ListPage>
  );
}

/** `_AdminsSummary`: total, active, new this month, and inactive accounts. */
function StaffSummary({ list }: { list: StaffList }) {
  const intl = useIntl();
  const summary = list.page?.summary;
  const card = (title: 'Total' | 'Active' | 'NewMonth' | 'Inactive', value: number) => (
    <StatCard
      title={intl.formatMessage({ id: `staffSummary${title}Title` })}
      value={String(value)}
      subtitle={intl.formatMessage({ id: `staffSummary${title}Subtitle` })}
    />
  );
  return (
    <SummaryGrid count={4}>
      {card('Total', summary?.totalUsers ?? 0)}
      {card('Active', summary ? activeCount(summary) : 0)}
      {card('NewMonth', summary?.newThisMonth ?? 0)}
      {card('Inactive', summary?.inactiveUsers ?? 0)}
    </SummaryGrid>
  );
}

/** AdminResourceListToolbar: search, date, filter, and new account; stacked on compact layouts. */
function StaffToolbar({ list }: { list: StaffList }) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const { compact } = useListLayout();

  const statusLabels: Record<StaffFilter, string> = {
    all: text('staffFilterAll'),
    active: text('staffFilterActive'),
    inactive: text('staffFilterInactive'),
  };
  const filterLabel = statusLabels[list.filter];
  const dateLabel = dateFilterLabel(intl, list.dateFilter);
  const fieldWidth = compact ? 'w-full' : 'w-[148px]';

  const search = (
    <SearchField
      value={list.searchText}
      onValueChange={list.setSearchText}
      placeholder={text('adminStaffSearchHint')}
      aria-label={text('adminStaffSearchHint')}
      clearLabel={text('adminCommonClearSearch')}
      className={compact ? undefined : 'min-w-0 flex-1'}
    />
  );
  const date = (
    <DateFilterField
      compact={compact}
      className={fieldWidth}
      filter={list.dateFilter}
      today={list.today}
      range={list.dateRange}
      title="staffDateFilterTitle"
      subtitle="staffDateFilterSubtitle"
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
      title={text('staffFilterSheetTitle')}
      subtitle={text('staffFilterSheetSubtitle')}
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={(['all', 'active', 'inactive'] as const).map((value) => ({
        value,
        label: statusLabels[value],
      }))}
      value={list.filter}
      clearValue="all"
      onApply={list.applyFilter}
    />
  );
  const newStaff = (
    <Button icon="add" onClick={list.newStaff} className={compact ? 'h-12 w-full' : 'h-12'}>
      {text('adminStaffNewButton')}
    </Button>
  );

  const chips = [
    list.dateFilter.kind !== 'all' && { label: dateLabel, onRemove: list.clearDate },
    list.filter !== 'all' && { label: filterLabel, onRemove: list.clearFilter },
  ].filter((chip) => chip !== false);

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {search}
          {date}
          {filter}
          {newStaff}
        </>
      ) : (
        <div className="flex items-center gap-3">
          {search}
          {date}
          {filter}
          {newStaff}
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
