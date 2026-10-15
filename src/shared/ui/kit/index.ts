// Admin kit (ADR-003, "Design system"): components built on the primitives for the panel's screens.
// They hold no copy; labels arrive as props.
export { SelectChips } from './choice-chip';
export { DataTable, type DataTableColumn } from './data-table';
export {
  EmptyState,
  InlineAction,
  Pagination,
  RefreshOverlay,
  StatusPill,
  TableAction,
  type ActionTone,
  type PaginationLabels,
  type StatusTone,
} from './data-display';
export {
  ActionPicker,
  DateRangeDialog,
  useWindowNarrowerThan,
  type ActionOption,
  type DateRangeLabels,
  type DayRange,
} from './date-pickers';
export { DateFilterField } from './date-filter-field';
export { DateInputField, type DateInputLabels } from './date-input-field';
export { detailLayoutFor, type DetailLayout } from './detail-layout';
export { ConfirmDialog, LoadingBarrier, PromptDialog, UnsavedChangesGuard } from './dialogs';
export { Avatar, CardList, CardListItem, EntityCard } from './entity';
export { CollapsibleSummary, ListPage, StatCard, SummaryGrid, useListLayout } from './list-page';
export { listLayoutFor, type ListLayout } from './list-layout';
export { LookupField, LookupList, type LookupOption } from './lookup-field';
export { ActionGroup, DetailRow, FormField, InfoCard, MutedPanel, PageHeader, SummaryCard } from './sections';
export {
  AccentIcon,
  ChoiceChips,
  FilterPicker,
  RemovableChip,
  SearchField,
  ToolbarField,
  type ChoiceOption,
} from './toolbar';
export { PhoneField, type PhoneFieldLabels } from './phone-field';
export { SegmentedTabs, type SegmentedTab } from './segmented-tabs';
export { TimePickerDialog, TimePickerField, type TimePickerLabels } from './time-picker';
export { useElementWidth } from './use-element-width';
