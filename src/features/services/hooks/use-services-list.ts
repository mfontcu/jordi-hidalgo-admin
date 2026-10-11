import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useDebouncedText } from '@/shared/lib/use-debounced-text';

import { serviceCategoriesQueryOptions, servicesListQueryOptions } from '../api/services.queries';
import { categoriesSummary, categoryTitle, type ServiceCategory } from '../model/service';
import {
  categoryFilter,
  filterCategoryCode,
  filterOf,
  listParamsOf,
  searchWithFilter,
  searchWithPage,
  searchWithText,
  type ServiceFilter,
} from '../model/services-search';

const NO_CATEGORIES: ServiceCategory[] = [];

/**
 * Services list (ServicesManagementScreen): the page of the URL's filters, the summary, the
 * debounced search, the filter, and the page.
 */
export function useServicesList() {
  const search = useSearch({ from: '/_authed/services/' });
  const navigate = useNavigate({ from: '/services/' });

  const list = useQuery({
    ...servicesListQueryOptions(listParamsOf(search)),
    placeholderData: keepPreviousData,
  });
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions());
  const categories = categoriesQuery.data ?? NO_CATEGORIES;

  const applySearch = useCallback(
    (query: string) => {
      void navigate({ search: (previous) => searchWithText(previous, query), replace: true });
    },
    [navigate],
  );
  const {
    text: searchText,
    setText: setSearchText,
    query,
  } = useDebouncedText(search.search ?? '', applySearch);

  const filter = filterOf(search);
  const filterCode = filterCategoryCode(filter);
  const filterCategory =
    filterCode === null ? undefined : categories.find((item) => item.code === filterCode);

  const applyFilter = (next: ServiceFilter) => {
    void navigate({
      search: (previous) => searchWithFilter({ ...previous, search: query || undefined }, next),
    });
  };

  const page = list.data;
  return {
    page,
    /** First load: nothing to show yet. */
    isLoading: list.isPending,
    /** A new page or filter is loading over the previous rows. */
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },

    searchText,
    setSearchText,

    filter,
    /** The label of a category filter (its name, else its code); null for the other filters. */
    categoryFilterLabel:
      filterCode === null ? null : filterCategory ? categoryTitle(filterCategory) : filterCode,
    categoryOptions: categories.map((category) => ({
      value: categoryFilter(category.code),
      label: categoryTitle(category),
    })),
    categoriesSummary: categoriesSummary(categories),
    /** The filter sheet asks for the categories again each time it opens, as Flutter does. */
    refreshCategories: () => {
      void categoriesQuery.refetch();
    },
    applyFilter,
    clearFilter: () => {
      applyFilter('all');
    },

    goToPage: (next: number) => {
      void navigate({ search: (previous) => searchWithPage(previous, next) });
    },

    openService: (serviceId: string) => {
      void navigate({ to: '/services/$serviceId', params: { serviceId } });
    },
    newVersion: (serviceId: string) => {
      void navigate({ to: '/services/$serviceId/form', params: { serviceId } });
    },
    newService: () => {
      void navigate({ to: '/services/form' });
    },
  };
}
