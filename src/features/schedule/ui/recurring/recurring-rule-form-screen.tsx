import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { formatWeekdayShort, WEEKDAYS, type Weekday } from '@/shared/lib/business-time';
import {
  ActionGroup,
  Button,
  EmptyState,
  InfoCard,
  MutedPanel,
  PageHeader,
  SelectChips,
  showErrorToast,
  showToast,
  Spinner,
  Switch,
  Textarea,
  TimePickerField,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useRecurringRuleForm, useRecurringRuleFormData } from '../../hooks/use-recurring-rule-form';
import { useRuleException } from '../../hooks/use-rule-exception';
import { ruleTimeRange, type RecurringRule, type RuleException } from '../../model/recurring-rule';
import { dotted, localeOf, textOf, timePickerLabels, weekdayName } from '../shared/labels';
import { ExceptionSheet } from './exception-sheet';
import { ExceptionsList } from './exceptions-list';

/** `_RecurringBlockedSlotFormLayoutSpec`, by the screen's width. */
function formLayoutFor(width: number) {
  if (width < 640) return { padding: 16, gap: 20, titleSize: 24, subtitleSize: 14, twoColumns: false };
  if (width < 1040) return { padding: 20, gap: 22, titleSize: 28, subtitleSize: 14, twoColumns: false };
  return { padding: 24, gap: 24, titleSize: 30, subtitleSize: 15, twoColumns: true };
}

type Data = ReturnType<typeof useRecurringRuleFormData>;

/** `/schedule/recurring-blocked-slots/form` and `/{id}/form` (RecurringBlockedSlotFormScreen). */
export function RecurringRuleFormScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const data = useRecurringRuleFormData();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={text(
              data.isEdit
                ? 'scheduleRecurringBlockedSlotFormEditTitle'
                : 'scheduleRecurringBlockedSlotFormNewTitle',
            )}
            subtitle={text(
              data.isEdit
                ? 'scheduleRecurringBlockedSlotFormEditSubtitle'
                : 'scheduleRecurringBlockedSlotFormNewSubtitle',
            )}
            titleSize={layout.titleSize}
            subtitleSize={layout.subtitleSize}
            back={{ label: text('scheduleRecurringBlockedSlotBack'), onClick: data.goBack }}
          />
          <div style={{ marginTop: width < 700 ? 12 : layout.gap }}>
            {data.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : data.error || data.rule === undefined ? (
              <EmptyState
                icon="error_outline"
                title={text('scheduleRecurringBlockedSlotFormLoadError')}
                message={describeFailure(data.error)}
                action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: data.retry }}
              />
            ) : (
              <FormContent rule={data.rule} data={data} twoColumns={layout.twoColumns} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ContentProps = { rule: RecurringRule | null; data: Data; twoColumns: boolean };

function FormContent({ rule, data, twoColumns }: ContentProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const locale = localeOf(intl);
  const describeFailure = useDescribeFailure();
  const form = useRecurringRuleForm({
    rule,
    onSaved: (isEdit) => {
      showToast(
        text(
          isEdit
            ? 'scheduleRecurringBlockedSlotFormUpdateSuccess'
            : 'scheduleRecurringBlockedSlotFormCreateSuccess',
        ),
      );
    },
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  // Exceptions are saved at once, on the stored rule; a new rule has none until it is saved.
  const exception = useRuleException(rule, {
    onSaved: () => {
      showToast(text('scheduleRecurringBlockedSlotExceptionSaveSuccess'));
    },
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  const { values } = form;
  const endError = form.endError ? text(form.endError) : undefined;

  const configuration = (
    <InfoCard title={text('scheduleRecurringBlockedSlotFormRuleConfiguration')} icon="repeat_rounded">
      <p className="mb-2.5 font-extrabold text-on-surface">
        {text('scheduleRecurringBlockedSlotFormWeekdayLabel')}
      </p>
      <SelectChips<`${Weekday}`>
        label={text('scheduleRecurringBlockedSlotFormWeekdayLabel')}
        options={WEEKDAYS.map((day) => ({ value: `${day}`, label: formatWeekdayShort(day, locale) }))}
        value={`${values.weekday}`}
        onValueChange={(value) => {
          form.setWeekday(Number(value) as Weekday);
        }}
      />
      <div className="mt-[18px] grid grid-cols-2 gap-3">
        <TimePickerField
          id="rule-start"
          label={text('scheduleTimeStart')}
          value={values.start}
          onChange={form.setStart}
          initialTime={values.start}
          language={locale}
          labels={timePickerLabels(intl, 'scheduleTimePickerSelectStart')}
        />
        <TimePickerField
          id="rule-end"
          label={text('scheduleTimeEnd')}
          value={values.end}
          onChange={form.setEnd}
          initialTime={values.end}
          language={locale}
          labels={timePickerLabels(intl, 'scheduleTimePickerSelectEnd')}
          error={endError}
        />
      </div>
      <MutedPanel className="mt-3.5 rounded-lg px-4 py-3.5">
        <label className="flex cursor-pointer items-center gap-3">
          <span className="flex-1 font-bold text-on-surface">
            {text('scheduleRecurringBlockedSlotFormRuleActiveToggle')}
          </span>
          <Switch tone="adaptive" checked={values.isActive} onCheckedChange={form.setActive} />
        </label>
      </MutedPanel>
    </InfoCard>
  );

  const reason = (
    <InfoCard title={text('scheduleFieldReason')} icon="notes_rounded">
      <Textarea
        rows={4}
        className="resize-none rounded-lg"
        aria-label={text('scheduleFieldReason')}
        placeholder={text('scheduleRecurringBlockedSlotFormReasonHint')}
        {...form.form.register('reason')}
      />
    </InfoCard>
  );

  const preview = (
    <InfoCard title={text('scheduleBlockedSlotFormPreviewSection')} icon="info_outline_rounded">
      <MutedPanel className="rounded-lg p-[18px]">
        <p className="text-[20px] font-black text-on-surface">
          {dotted(weekdayName(intl, values.weekday), ruleTimeRange(values))}
        </p>
        <p className="mt-2 leading-[1.5] text-content-secondary">
          {values.reason.trim() || text('scheduleNoReasonDefined')}
        </p>
        <p
          className={
            values.isActive
              ? 'mt-3 font-extrabold text-success-fg'
              : 'mt-3 font-extrabold text-content-secondary'
          }
        >
          {text(
            values.isActive
              ? 'scheduleRecurringBlockedSlotFormRuleActiveLabel'
              : 'scheduleRecurringBlockedSlotFormRuleInactiveLabel',
          )}
        </p>
      </MutedPanel>
    </InfoCard>
  );

  const exceptions = (
    <InfoCard
      title={text('scheduleRecurringBlockedSlotFormExceptionsSection')}
      icon="event_available_outlined"
    >
      {rule ? (
        <FormExceptions
          exceptions={data.exceptions}
          error={data.exceptionsError}
          onRetry={data.retryExceptions}
          onAdd={() => {
            exception.setOpen(true);
          }}
        />
      ) : (
        <p className="leading-[1.55] text-content-secondary">
          {text('scheduleRecurringBlockedSlotFormExceptionsUnavailable')}
        </p>
      )}
    </InfoCard>
  );

  const actions = (
    <InfoCard title={text('scheduleBlockedSlotFormActionsSection')} icon="bolt_outlined">
      <ActionGroup
        primary={{
          label: text(rule ? 'clientFormSaveChanges' : 'scheduleRecurringBlockedSlotFormCreate'),
          icon: 'save_outlined',
          onClick: () => {
            if (!form.isSaving) void form.submit();
          },
          loading: form.isSaving,
        }}
        secondary={{ label: text('adminCommonCancel'), icon: 'close_rounded', onClick: data.goBack }}
      />
    </InfoCard>
  );

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.isSaving) void form.submit();
      }}
    >
      {twoColumns ? (
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {configuration}
            {reason}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {preview}
            {exceptions}
            {actions}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {configuration}
          {preview}
          {reason}
          {exceptions}
          {actions}
        </div>
      )}
      {rule && <ExceptionSheet rule={rule} exception={exception} />}
      <UnsavedChangesGuard
        when={form.hasUnsavedChanges}
        labels={{
          title: text('adminUnsavedChangesTitle'),
          message: text('adminUnsavedChangesBody'),
          keepEditing: text('adminUnsavedChangesKeepEditing'),
          discard: text('adminUnsavedChangesDiscard'),
        }}
      />
    </form>
  );
}

type FormExceptionsProps = {
  exceptions: RuleException[] | undefined;
  error: unknown;
  onRetry: () => void;
  onAdd: () => void;
};

/** `_ExceptionsPreview` of an edit: the exceptions and "add another", or the hint and "add". */
function FormExceptions({ exceptions, error, onRetry, onAdd }: FormExceptionsProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const any = (exceptions?.length ?? 0) > 0;
  return (
    <div className="flex flex-col gap-3.5">
      {any || error ? (
        <ExceptionsList exceptions={exceptions} error={error} onRetry={onRetry} variant="form" />
      ) : (
        <p className="leading-[1.55] text-content-secondary">
          {text('scheduleRecurringBlockedSlotFormExceptionsHint')}
        </p>
      )}
      <Button variant="secondary" icon="event_available_outlined" onClick={onAdd} className="w-full">
        {text(
          any
            ? 'scheduleRecurringBlockedSlotFormAddAnotherException'
            : 'scheduleRecurringBlockedSlotFormAddException',
        )}
      </Button>
    </div>
  );
}
