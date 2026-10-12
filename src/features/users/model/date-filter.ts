import { dateFilterSearchSchemaFor, type DatePick } from '@/shared/lib/date-filter';

// The registration-date filter of the users lists (StaffDatePreset, ClientDatePreset): every
// account, today, this month, or a range of salon days (`shared/lib/date-filter`).

export const USER_DATE_PRESETS = ['today', 'month'] as const;

export const dateFilterSearchSchema = dateFilterSearchSchemaFor(USER_DATE_PRESETS);

/** The options of the date sheet (AdminDateQuickPick), in order. */
export const DATE_QUICK_PICKS = ['all', 'today', 'month', 'custom'] as const satisfies readonly DatePick[];
