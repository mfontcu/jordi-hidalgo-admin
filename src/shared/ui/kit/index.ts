// Admin kit (ADR-003, "Design system"): components built on the primitives for the panel's screens.
// They hold no copy; labels arrive as props.
export { DataTable, type DataTableColumn } from './data-table';
export {
  EmptyState,
  InlineAction,
  Pagination,
  RefreshOverlay,
  StatusPill,
  TableAction,
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
export { detailLayoutFor, type DetailLayout } from './detail-layout';
export { ConfirmDialog, LoadingBarrier, UnsavedChangesGuard } from './dialogs';
export { Avatar, EntityCard } from './entity';
export { ListPage, StatCard, SummaryGrid, useListLayout } from './list-page';
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
export { useElementWidth } from './use-element-width';
