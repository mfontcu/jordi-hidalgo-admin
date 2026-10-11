import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
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

import { useServicesList } from '../hooks/use-services-list';
import type { ServiceFilter } from '../model/services-search';
import { ServicesRows } from './services-rows';

type ServicesList = ReturnType<typeof useServicesList>;

/** `/services` (ServicesManagementScreen): summary, search and filter, and the services. */
export function ServicesScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const list = useServicesList();

  return (
    <ListPage
      title={intl.formatMessage({ id: 'serviceListTitle' })}
      subtitle={intl.formatMessage({ id: 'serviceListSubtitle' })}
      summaryLabel={intl.formatMessage({ id: 'adminSummaryTitle' })}
      summary={<ServicesSummary list={list} />}
      toolbar={<ServicesToolbar list={list} />}
    >
      {list.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={36} className="text-primary" />
        </div>
      ) : list.error ? (
        <EmptyState
          icon="error_outline"
          title={intl.formatMessage({ id: 'serviceLoadErrorTitle' })}
          message={describeFailure(list.error)}
          action={{
            label: intl.formatMessage({ id: 'adminCommonRetry' }),
            icon: 'refresh',
            onClick: list.retry,
          }}
        />
      ) : !list.page || list.page.items.length === 0 ? (
        <EmptyState
          icon="content_cut_outlined"
          title={intl.formatMessage({ id: 'serviceListEmptyTitle' })}
          message={intl.formatMessage({ id: 'serviceListEmptyMessage' })}
          action={{ label: intl.formatMessage({ id: 'serviceNewButton' }), onClick: list.newService }}
        />
      ) : (
        <ServicesRows
          page={list.page}
          refreshing={list.isRefreshing}
          onOpen={list.openService}
          onNewVersion={list.newVersion}
          onPageChange={list.goToPage}
        />
      )}
    </ListPage>
  );
}

function ServicesSummary({ list }: { list: ServicesList }) {
  const intl = useIntl();
  const summary = list.page?.summary;
  const card = (title: 'Total' | 'Active' | 'Inactive', value: number | undefined) => (
    <StatCard
      title={intl.formatMessage({ id: `serviceSummary${title}Title` })}
      value={String(value ?? 0)}
      subtitle={intl.formatMessage({ id: `serviceSummary${title}Subtitle` })}
    />
  );
  return (
    <SummaryGrid count={4}>
      {card('Total', summary?.totalServices)}
      {card('Active', summary?.activeServices)}
      {card('Inactive', summary?.inactiveServices)}
      <StatCard
        title={intl.formatMessage({ id: 'serviceSummaryCategoriesTitle' })}
        value={String(summary?.totalCategories ?? 0)}
        subtitle={
          list.categoriesSummary ?? intl.formatMessage({ id: 'serviceSummaryCategoriesDefaultSubtitle' })
        }
      />
    </SummaryGrid>
  );
}

/** ServicesToolbar: search, filter, and new service; stacked on compact layouts. */
function ServicesToolbar({ list }: { list: ServicesList }) {
  const intl = useIntl();
  const { compact } = useListLayout();

  const statusLabels = {
    all: intl.formatMessage({ id: 'serviceFilterAll' }),
    active: intl.formatMessage({ id: 'serviceFilterActive' }),
    inactive: intl.formatMessage({ id: 'serviceFilterInactive' }),
  };
  const filterLabel =
    list.categoryFilterLabel ??
    (list.filter === 'active' || list.filter === 'inactive' ? statusLabels[list.filter] : statusLabels.all);
  const options: { value: ServiceFilter; label: string }[] = [
    { value: 'all', label: statusLabels.all },
    { value: 'active', label: statusLabels.active },
    { value: 'inactive', label: statusLabels.inactive },
    ...list.categoryOptions,
  ];

  const search = (
    <SearchField
      value={list.searchText}
      onValueChange={list.setSearchText}
      placeholder={intl.formatMessage({ id: 'serviceSearchHint' })}
      aria-label={intl.formatMessage({ id: 'serviceSearchHint' })}
      clearLabel={intl.formatMessage({ id: 'adminCommonClearSearch' })}
      className={compact ? undefined : 'min-w-0 flex-1'}
    />
  );
  const filter = (
    <FilterPicker
      compact={compact}
      trigger={
        <ToolbarField icon="tune_rounded" label={filterLabel} className={compact ? 'w-full' : 'w-[148px]'} />
      }
      title={intl.formatMessage({ id: 'serviceFilterSheetTitle' })}
      subtitle={intl.formatMessage({ id: 'serviceFilterSheetSubtitle' })}
      clearLabel={intl.formatMessage({ id: 'adminCommonClear' })}
      applyLabel={intl.formatMessage({ id: 'adminCommonApply' })}
      options={options}
      value={list.filter}
      clearValue="all"
      onApply={list.applyFilter}
      onOpen={list.refreshCategories}
    />
  );
  const newService = (
    <Button icon="add" onClick={list.newService} className={compact ? 'h-12 w-full' : 'h-12'}>
      {intl.formatMessage({ id: 'serviceNewButton' })}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {search}
          {filter}
          {newService}
        </>
      ) : (
        <div className="flex items-center gap-3">
          {search}
          {filter}
          {newService}
        </div>
      )}
      {list.filter !== 'all' && (
        <div>
          <RemovableChip
            label={filterLabel}
            removeLabel={intl.formatMessage({ id: 'adminFilterRemove' }, { filter: filterLabel })}
            onRemove={list.clearFilter}
          />
        </div>
      )}
    </div>
  );
}
