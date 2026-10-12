import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatInstant, type DateLocale } from '@/shared/lib/business-time';
import { EmptyState, ListPage, Spinner, StatCard, SummaryGrid } from '@/shared/ui';

import { useStaffList } from '../../hooks/use-staff-list';
import { activeCount, staffStatus, type AdminUser } from '../../model/admin-user';
import type { StaffFilter } from '../../model/staff-search';
import { UsersRows, type UserExtraColumn } from '../shared/users-rows';
import { UsersToolbar } from '../shared/users-toolbar';

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
          title={intl.formatMessage({ id: 'staffListLoadError' })}
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

const STAFF_FILTERS = ['all', 'active', 'inactive'] as const;

const STAFF_FILTER_LABELS = {
  all: 'staffFilterAll',
  active: 'staffFilterActive',
  inactive: 'staffFilterInactive',
} as const satisfies Record<StaffFilter, MessageId>;

/** AdminResourceListToolbar with the staff copy. */
function StaffToolbar({ list }: { list: StaffList }) {
  return (
    <UsersToolbar
      list={list}
      filters={STAFF_FILTERS}
      filterLabels={STAFF_FILTER_LABELS}
      copy={{
        searchHint: 'adminStaffSearchHint',
        filterTitle: 'staffFilterSheetTitle',
        filterSubtitle: 'staffFilterSheetSubtitle',
        dateTitle: 'staffDateFilterTitle',
        dateSubtitle: 'staffDateFilterSubtitle',
        newButton: 'adminStaffNewButton',
      }}
      onNew={list.newStaff}
    />
  );
}
