import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { formatInstant, formatInstantDateTime, type DateLocale } from '@/shared/lib/business-time';
import { EmptyState, ListPage, Spinner, StatCard, SummaryGrid } from '@/shared/ui';

import { useClientsList } from '../../hooks/use-clients-list';
import { clientStatus, displayNameOf } from '../../model/client';
import { CLIENT_FILTER_LABELS, CLIENT_STATUSES, type ClientFilter } from '../../model/clients-search';
import { UsersRows, type UserExtraColumn } from '../shared/users-rows';
import { UsersToolbar } from '../shared/users-toolbar';

type ClientsList = ReturnType<typeof useClientsList>;

const CLIENT_FILTERS: readonly ClientFilter[] = ['all', ...CLIENT_STATUSES];

/** `/clients` (ClientsScreen): summary, search and filters, and the clients. */
export function ClientsScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const list = useClientsList();
  const locale = intl.locale as DateLocale;

  // formatClientListDate and formatClientListDateTime: "d MMM y", then " · HH:mm" for the next one.
  const extraColumns = useMemo(
    (): UserExtraColumn[] => [
      {
        header: intl.formatMessage({ id: 'clientColumnLastAppointment' }),
        value: (user) => formatInstant(user.lastAppointmentAt, locale, 'listDate'),
      },
      {
        header: intl.formatMessage({ id: 'clientColumnNextAppointment' }),
        value: (user) => formatInstantDateTime(user.nextAppointmentAt, locale, 'listDate'),
      },
    ],
    [intl, locale],
  );

  return (
    <ListPage
      title={intl.formatMessage({ id: 'clientListTitle' })}
      subtitle={intl.formatMessage({ id: 'clientListSubtitle' })}
      summaryLabel={intl.formatMessage({ id: 'adminSummaryTitle' })}
      summary={<ClientsSummary list={list} />}
      toolbar={
        <UsersToolbar
          list={list}
          filters={CLIENT_FILTERS}
          filterLabels={CLIENT_FILTER_LABELS}
          copy={{
            searchHint: 'adminClientsSearchHint',
            filterTitle: 'clientFilterSheetTitle',
            filterSubtitle: 'clientFilterSheetSubtitle',
            dateTitle: 'clientDateFilterTitle',
            dateSubtitle: 'clientDateFilterSubtitle',
            newButton: 'adminClientsNewButton',
          }}
          onNew={list.newClient}
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
          title={intl.formatMessage({ id: 'clientListLoadError' })}
          message={describeFailure(list.error)}
          action={{
            label: intl.formatMessage({ id: 'adminCommonRetry' }),
            icon: 'refresh',
            onClick: list.retry,
          }}
        />
      ) : !list.page || list.page.items.length === 0 ? (
        <EmptyState
          icon="people_outline"
          title={intl.formatMessage({ id: 'clientListEmptyTitle' })}
          message={intl.formatMessage({ id: 'clientListEmptyMessage' })}
          action={{ label: intl.formatMessage({ id: 'adminClientsNewButton' }), onClick: list.newClient }}
        />
      ) : (
        <UsersRows
          page={list.page}
          refreshing={list.isRefreshing}
          nameHeader={intl.formatMessage({ id: 'adminUserColumnClient' })}
          extraColumns={extraColumns}
          status={clientStatus}
          nameOf={displayNameOf}
          onOpen={list.openClient}
          onPageChange={list.goToPage}
        />
      )}
    </ListPage>
  );
}

/** `_ClientsSummary`: total, with an upcoming appointment, new this month, unverified, blocked. */
function ClientsSummary({ list }: { list: ClientsList }) {
  const intl = useIntl();
  const summary = list.page?.summary;
  const card = (title: 'Total' | 'Upcoming' | 'NewMonth' | 'Unverified' | 'Blocked', value: number) => (
    <StatCard
      title={intl.formatMessage({ id: `clientSummary${title}Title` })}
      value={String(value)}
      subtitle={intl.formatMessage({ id: `clientSummary${title}Subtitle` })}
    />
  );
  return (
    <SummaryGrid count={5}>
      {card('Total', summary?.totalUsers ?? 0)}
      {card('Upcoming', summary?.withUpcomingAppointment ?? 0)}
      {card('NewMonth', summary?.newThisMonth ?? 0)}
      {card('Unverified', summary?.inactiveUsers ?? 0)}
      {card('Blocked', summary?.blockedUsers ?? 0)}
    </SummaryGrid>
  );
}
