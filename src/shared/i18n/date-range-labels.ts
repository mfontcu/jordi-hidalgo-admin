import type { IntlShape } from 'react-intl';

import type { MessageId } from './messages';

/** The range picker's copy (showAdminDateRangePickerDialog), in the shape of the kit's `DateRangeLabels`. */
export function dateRangeDialogLabels(intl: IntlShape) {
  const text = (id: MessageId) => intl.formatMessage({ id });
  return {
    title: text('clientDateChooseRangeTitle'),
    start: text('adminDateRangeStartLabel'),
    end: text('adminDateRangeEndLabel'),
    notSelected: text('adminDateRangeNotSelected'),
    last7Days: text('adminDateRangePresetLast7Days'),
    last30Days: text('adminDateRangePresetLast30Days'),
    thisMonth: text('adminCommonThisMonth'),
    clear: text('clientDateClearRange'),
    cancel: text('adminCommonCancel'),
    apply: text('clientDateApplyRange'),
    previousMonth: text('dayAgendaPrevMonth'),
    nextMonth: text('dayAgendaNextMonth'),
  };
}
