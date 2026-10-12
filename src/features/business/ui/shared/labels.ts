import type { IntlShape } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import type { DateLocale } from '@/shared/lib/business-time';
import type { DateInputLabels } from '@/shared/ui';

export const localeOf = (intl: IntlShape) => intl.locale as DateLocale;

export const textOf = (intl: IntlShape) => (id: MessageId) => intl.formatMessage({ id });

/** AdminDateInputField's dialog copy. */
export function dateInputLabels(intl: IntlShape): DateInputLabels {
  const text = textOf(intl);
  return {
    title: text('adminDateInputTitle'),
    subtitle: text('adminDateInputSubtitle'),
    apply: text('adminDateInputApply'),
    cancel: text('adminCommonCancel'),
  };
}
