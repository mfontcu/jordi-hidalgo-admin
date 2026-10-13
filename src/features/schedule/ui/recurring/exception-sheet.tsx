import { useId } from 'react';
import { useIntl } from 'react-intl';

import { dateToDay, dayToDate, formatDay, weekdayOf } from '@/shared/lib/business-time';
import {
  Button,
  Calendar,
  Icon,
  Label,
  MutedPanel,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Textarea,
} from '@/shared/ui';

import type { useRuleException } from '../../hooks/use-rule-exception';
import { ruleTimeRange, type RecurringRule } from '../../model/recurring-rule';
import { dotted, localeOf, ruleReasonText, textOf, weekdayName } from '../shared/labels';

type ExceptionSheetProps = { rule: RecurringRule; exception: ReturnType<typeof useRuleException> };

/**
 * The exception sheet: the rule, the day (an inline calendar of the rule's weekdays), and the
 * reason. Flutter has two copies of it, in the form and in the detail; the panel shares this one.
 */
export function ExceptionSheet({ rule, exception }: ExceptionSheetProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const locale = localeOf(intl);
  const reasonId = useId();
  const weekday = weekdayName(intl, rule.weekday);
  const range = ruleTimeRange(rule);
  const days = exception.days;

  return (
    <Sheet open={exception.open} onOpenChange={exception.setOpen}>
      <SheetContent>
        <div className="flex flex-col px-6 pt-1 pb-6">
          <SheetTitle className="text-heading">
            {text('scheduleRecurringBlockedSlotExceptionSheetTitle')}
          </SheetTitle>
          <SheetDescription className="mt-2 text-body text-muted-foreground">
            {intl.formatMessage(
              { id: 'scheduleRecurringBlockedSlotExceptionSheetSubtitle' },
              { weekday, timeRange: range },
            )}
          </SheetDescription>
          <MutedPanel className="mt-5 rounded-lg p-4">
            <p className="text-heading text-foreground">{dotted(weekday, range)}</p>
            <p className="mt-2 text-body text-muted-foreground">{ruleReasonText(intl, rule)}</p>
          </MutedPanel>
          <p className="mt-5 mb-2 text-body-strong text-foreground">
            {text('scheduleRecurringBlockedSlotExceptionDateLabel')}
          </p>
          <button
            type="button"
            aria-expanded={exception.calendarOpen}
            onClick={exception.toggleCalendar}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-4 text-left hover:bg-muted"
          >
            <Icon name="calendar_today_rounded" className="text-foreground" />
            <span className="min-w-0 flex-1 text-body-strong text-foreground">
              {formatDay(exception.day, locale, 'paddedListDate')}
            </span>
            <Icon name="calendar_month_rounded" className="text-muted-foreground" />
          </button>
          {exception.calendarOpen && days && (
            <div className="mt-3 rounded-lg border border-border bg-card px-2 pt-2 pb-3">
              <Calendar
                mode="single"
                language={locale}
                required
                selected={dayToDate(exception.day)}
                defaultMonth={dayToDate(exception.day)}
                onSelect={(value) => {
                  exception.pickDay(dateToDay(value));
                }}
                startMonth={dayToDate(days.first)}
                endMonth={dayToDate(days.last)}
                // Only the rule's weekday, from today to a year ahead (selectableDayPredicate).
                disabled={[
                  { before: dayToDate(days.first) },
                  { after: dayToDate(days.last) },
                  (value: Date) => weekdayOf(dateToDay(value)) !== rule.weekday,
                ]}
              />
              <div className="flex justify-end">
                <Button variant="text" icon="check_rounded" onClick={exception.closeCalendar}>
                  {text('scheduleRecurringBlockedSlotExceptionUseDate')}
                </Button>
              </div>
            </div>
          )}
          <Label htmlFor={reasonId} className="mt-4 mb-2 text-body-strong">
            {text('scheduleRecurringBlockedSlotExceptionReasonLabel')}
          </Label>
          <Textarea
            id={reasonId}
            rows={3}
            className="resize-none rounded-lg"
            placeholder={text('scheduleRecurringBlockedSlotExceptionReasonHint')}
            value={exception.reason}
            onChange={(event) => {
              exception.setReason(event.target.value);
            }}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              icon="close_rounded"
              onClick={() => {
                exception.setOpen(false);
              }}
            >
              {text('adminCommonCancel')}
            </Button>
            <Button icon="save_outlined" onClick={exception.save} loading={exception.isSaving}>
              {text('scheduleRecurringBlockedSlotExceptionSave')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
