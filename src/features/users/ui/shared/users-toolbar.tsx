import { useIntl } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import type { BusinessDay } from '@/shared/lib/business-time';
import { Button, FilterPicker, RemovableChip, SearchField, ToolbarField, useListLayout } from '@/shared/ui';

import type { DateFilter, DatePick } from '@/shared/lib/date-filter';
import { DateFilterField, dateFilterLabel } from './date-filter-field';

/** What the toolbar reads from a list hook (useStaffList, useClientsList). */
type ToolbarList<F extends string> = {
  searchText: string;
  setSearchText: (text: string) => void;
  filter: F;
  applyFilter: (filter: F) => void;
  clearFilter: () => void;
  today: BusinessDay;
  dateFilter: DateFilter;
  dateRange: { from: BusinessDay; to: BusinessDay } | null;
  pickDate: (pick: DatePick) => void;
  rangeOpen: boolean;
  setRangeOpen: (open: boolean) => void;
  applyRange: (from: BusinessDay, to: BusinessDay) => void;
  clearDate: () => void;
};

type UsersToolbarProps<F extends string> = {
  list: ToolbarList<F>;
  /** The filters in the sheet's order, "all" first, with their labels. */
  filters: readonly F[];
  filterLabels: Record<F, MessageId>;
  /** The role's copy: search hint, filter and date sheets, and the new-account button. */
  copy: {
    searchHint: MessageId;
    filterTitle: MessageId;
    filterSubtitle: MessageId;
    dateTitle: MessageId;
    dateSubtitle: MessageId;
    newButton: MessageId;
  };
  onNew: () => void;
};

/**
 * AdminResourceListToolbar: search, date, filter, and new account in a row; stacked on compact
 * layouts. Each active filter, the date one too, shows as a chip that removes it.
 */
export function UsersToolbar<F extends string>({
  list,
  filters,
  filterLabels,
  copy,
  onNew,
}: UsersToolbarProps<F>) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const { compact } = useListLayout();

  const allFilter = filters[0];
  const filterLabel = text(filterLabels[list.filter]);
  const dateLabel = dateFilterLabel(intl, list.dateFilter);
  const fieldWidth = compact ? 'w-full' : 'w-[148px]';

  const search = (
    <SearchField
      value={list.searchText}
      onValueChange={list.setSearchText}
      placeholder={text(copy.searchHint)}
      aria-label={text(copy.searchHint)}
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
      title={copy.dateTitle}
      subtitle={copy.dateSubtitle}
      onPick={list.pickDate}
      rangeOpen={list.rangeOpen}
      onRangeOpenChange={list.setRangeOpen}
      onApplyRange={list.applyRange}
    />
  );
  const filter = allFilter !== undefined && (
    <FilterPicker
      compact={compact}
      trigger={<ToolbarField icon="tune_rounded" label={filterLabel} className={fieldWidth} />}
      title={text(copy.filterTitle)}
      subtitle={text(copy.filterSubtitle)}
      clearLabel={text('adminCommonClear')}
      applyLabel={text('adminCommonApply')}
      options={filters.map((value) => ({ value, label: text(filterLabels[value]) }))}
      value={list.filter}
      clearValue={allFilter}
      onApply={list.applyFilter}
    />
  );
  const newAccount = (
    <Button icon="add" onClick={onNew} className={compact ? 'h-12 w-full' : 'h-12'}>
      {text(copy.newButton)}
    </Button>
  );

  const chips = [
    list.dateFilter.kind !== 'all' && { label: dateLabel, onRemove: list.clearDate },
    list.filter !== allFilter && { label: filterLabel, onRemove: list.clearFilter },
  ].filter((chip) => chip !== false);

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <>
          {search}
          {date}
          {filter}
          {newAccount}
        </>
      ) : (
        <div className="flex items-center gap-3">
          {search}
          {date}
          {filter}
          {newAccount}
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
