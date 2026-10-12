import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { Button, Icon } from '@/shared/ui';

import { exceptionDateLabel, type RuleException } from '../../model/recurring-rule';
import { localeOf, textOf } from '../shared/labels';

type ExceptionsListProps = {
  exceptions: RuleException[] | undefined;
  error: unknown;
  onRetry: () => void;
  /** `_ExceptionRow` of the detail, with an icon tile; plain rows in the form. */
  variant: 'detail' | 'form';
};

/** A rule's exceptions: the day and the reason, or "Occurrence opened" without one. */
export function ExceptionsList({ exceptions, error, onRetry, variant }: ExceptionsListProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="leading-[1.5] text-content-secondary">
          {[text('scheduleRecurringBlockedSlotExceptionsLoadError'), describeFailure(error)].join(' ')}
        </p>
        <Button variant="text" icon="refresh" onClick={onRetry}>
          {text('adminCommonRetry')}
        </Button>
      </div>
    );
  }
  if (!exceptions) return null;
  const reasonOf = (exception: RuleException) =>
    exception.reason || text('scheduleRecurringBlockedSlotExceptionOpenedOccurrence');

  if (variant === 'form') {
    return (
      <ul className="flex flex-col gap-3.5">
        {exceptions.map((exception) => (
          <li key={exception.id}>
            <p className="font-black text-on-surface">{exceptionDateLabel(exception, localeOf(intl))}</p>
            <p className="mt-1 leading-[1.45] text-content-secondary">{reasonOf(exception)}</p>
          </li>
        ))}
      </ul>
    );
  }
  if (exceptions.length === 0) {
    return (
      <p className="leading-[1.55] text-content-secondary">
        {text('scheduleRecurringBlockedSlotDetailExceptionsEmpty')}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {exceptions.map((exception) => (
        <li key={exception.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className="flex shrink-0 rounded-[14px] bg-success-bg p-2.5 text-success-fg">
            <Icon name="event_available_outlined" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-black text-on-surface">{exceptionDateLabel(exception, localeOf(intl))}</p>
            <p className="mt-1 leading-[1.4] text-content-secondary">{reasonOf(exception)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
