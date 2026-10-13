import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { AppointmentConflictsCheck } from '@/features/appointments';
import { useDescribeFailure } from '@/shared/i18n';
import {
  ActionGroup,
  DateInputField,
  EmptyState,
  FormField,
  InfoCard,
  MutedPanel,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  SummaryCard,
  Switch,
  Textarea,
  TimePickerField,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useBlockedSlotForm, useBlockedSlotFormData } from '../../hooks/use-blocked-slot-form';
import { blockedSlotDate, type BlockedSlot } from '../../model/blocked-slot';
import { previewDate, previewTimeRange } from '../../model/blocked-slot-form';
import {
  dotted,
  blockedSlotTimeText,
  dateInputLabels,
  localeOf,
  textOf,
  timePickerLabels,
} from '../shared/labels';

/** `_BlockedSlotFormLayoutSpec`, by the screen's width. */
function formLayoutFor(width: number) {
  if (width < 640) return { padding: 16, gap: 20, gapLarge: 24, twoColumns: false };
  if (width < 1040) return { padding: 20, gap: 22, gapLarge: 26, twoColumns: false };
  return { padding: 24, gap: 24, gapLarge: 28, twoColumns: true };
}

type Layout = ReturnType<typeof formLayoutFor>;

/** `/schedule/blocked-slots/form` and `/schedule/blocked-slots/{id}/form` (BlockedSlotFormScreen). */
export function BlockedSlotFormScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const data = useBlockedSlotFormData();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={text(data.isEdit ? 'scheduleBlockedSlotFormEditTitle' : 'scheduleBlockedSlotFormNewTitle')}
            subtitle={text(
              data.isEdit ? 'scheduleBlockedSlotFormEditSubtitle' : 'scheduleBlockedSlotFormNewSubtitle',
            )}
            back={{ label: text('scheduleBlockedSlotBack'), onClick: data.goBack }}
          />
          <div style={{ marginTop: width < 768 ? 12 : layout.gap }}>
            {data.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : data.error || data.slot === undefined ? (
              <EmptyState
                icon="error_outline"
                title={text('scheduleBlockedSlotFormLoadError')}
                message={describeFailure(data.error)}
                action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: data.retry }}
              />
            ) : (
              <FormContent slot={data.slot} layout={layout} onCancel={data.goBack} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ContentProps = { slot: BlockedSlot | null; layout: Layout; onCancel: () => void };

function FormContent({ slot, layout, onCancel }: ContentProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const locale = localeOf(intl);
  const describeFailure = useDescribeFailure();
  const form = useBlockedSlotForm({
    slot,
    onSaved: (isEdit, cancellation) => {
      showToast(
        text(isEdit ? 'scheduleBlockedSlotFormUpdateSuccess' : 'scheduleBlockedSlotFormCreateSuccess'),
      );
      if (cancellation && cancellation.cancelled > 0) {
        showToast(
          intl.formatMessage({ id: 'blockedSlotConflictsCancelledToast' }, { count: cancellation.cancelled }),
        );
      }
      if (cancellation && cancellation.failed > 0) {
        showErrorToast(
          intl.formatMessage({ id: 'blockedSlotConflictsCancelFailed' }, { failed: cancellation.failed }),
        );
      }
    },
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  const { values } = form;
  const errorText = (field: 'day' | 'start' | 'end' | 'reason') => {
    const key = form.errorKey(field);
    return key ? text(key) : undefined;
  };

  const configuration = (
    <InfoCard title={text('scheduleSectionConfiguration')} icon="block_outlined">
      <div className="flex flex-col gap-4">
        <FormField id="blocked-slot-day" label={text('appointmentFieldDate')} error={errorText('day')}>
          <DateInputField
            id="blocked-slot-day"
            value={values.day || null}
            onChange={form.setDay}
            placeholder={text('scheduleBlockedSlotFormDateHint')}
            initialDay={form.today}
            first={form.dayRange.first}
            last={form.dayRange.last}
            language={locale}
            labels={dateInputLabels(intl)}
            invalid={errorText('day') !== undefined}
            describedBy={errorText('day') ? 'blocked-slot-day-error' : undefined}
          />
        </FormField>
        <SwitchPanel
          label={text('scheduleBlockedSlotFormFullDayToggle')}
          checked={values.fullDay}
          onCheckedChange={form.setFullDay}
          className="p-3.5"
        />
        <div className={layout.twoColumns ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-4'}>
          <TimePickerField
            id="blocked-slot-start"
            label={text('scheduleTimeStart')}
            value={values.start}
            onChange={form.setStart}
            enabled={!values.fullDay}
            initialTime="09:00"
            language={locale}
            labels={timePickerLabels(intl, 'scheduleTimePickerSelectStart')}
            error={values.fullDay ? undefined : errorText('start')}
          />
          <TimePickerField
            id="blocked-slot-end"
            label={text('scheduleTimeEnd')}
            value={values.end}
            onChange={form.setEnd}
            enabled={!values.fullDay}
            initialTime="11:00"
            language={locale}
            labels={timePickerLabels(intl, 'scheduleTimePickerSelectEnd')}
            error={values.fullDay ? undefined : errorText('end')}
          />
        </div>
      </div>
    </InfoCard>
  );

  const reason = (
    <InfoCard title={text('scheduleBlockedSlotFormReasonSection')} icon="notes_outlined">
      <FormField id="blocked-slot-reason" label={text('scheduleFieldReason')} error={errorText('reason')}>
        <Textarea
          id="blocked-slot-reason"
          rows={4}
          className="resize-none"
          placeholder={text('scheduleBlockedSlotFormReasonHint')}
          aria-invalid={errorText('reason') ? true : undefined}
          aria-describedby={errorText('reason') ? 'blocked-slot-reason-error' : undefined}
          {...form.form.register('reason')}
        />
      </FormField>
    </InfoCard>
  );

  const preview = (
    <InfoCard title={text('scheduleBlockedSlotFormPreviewSection')} icon="info_outline">
      <MutedPanel>
        <p className="text-heading text-foreground">
          {previewDate(values.day, locale) ?? text('scheduleBlockedSlotFormPreviewNoDate')}
        </p>
        <p className="mt-2 text-body text-muted-foreground">
          {previewTimeRange(values) ?? text('scheduleBlockedSlotFullDayLabel')}
        </p>
        <p className="mt-2 text-body text-muted-foreground">
          {values.reason || text('scheduleBlockedSlotFormPreviewNoReason')}
        </p>
      </MutedPanel>
    </InfoCard>
  );

  const visibility = (
    <InfoCard title={text('scheduleBlockedSlotFormWebVisibilitySection')} icon="public_outlined">
      <SwitchPanel
        label={text(
          values.showOnPublicSite
            ? 'scheduleBlockedSlotFormWebVisibleHint'
            : 'scheduleBlockedSlotFormWebHiddenHint',
        )}
        checked={values.showOnPublicSite}
        onCheckedChange={form.setShowOnPublicSite}
        hint
      />
    </InfoCard>
  );

  const actions = (
    <InfoCard title={text('scheduleBlockedSlotFormActionsSection')} icon="bolt_outlined">
      <ActionGroup
        primary={{
          label: text(slot ? 'scheduleBlockedSlotFormSaveChanges' : 'scheduleBlockedSlotFormCreate'),
          icon: 'save_outlined',
          onClick: () => {
            if (!form.isSaving) void form.submit();
          },
          loading: form.isSaving,
        }}
        secondary={{ label: text('adminCommonCancel'), icon: 'close', onClick: onCancel }}
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
      {slot && <StoredSummary slot={slot} gap={layout.gapLarge} />}
      {layout.twoColumns ? (
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {configuration}
            {reason}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {preview}
            {visibility}
            {actions}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {configuration}
          {reason}
          {preview}
          {visibility}
          {actions}
        </div>
      )}
      <AppointmentConflictsCheck
        {...form.conflictCheck}
        confirmLabel={text(slot ? 'scheduleBlockedSlotFormSaveChanges' : 'blockedSlotConflictConfirm')}
      />
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

/** `_BlockedSlotSummaryCard` of an edit: the stored block, over the form. */
function StoredSummary({ slot, gap }: { slot: BlockedSlot; gap: number }) {
  const intl = useIntl();
  const text = textOf(intl);
  return (
    <div style={{ marginBottom: gap }}>
      <SummaryCard className="p-5">
        <p className="text-label text-muted-foreground">{text('scheduleBlockedSlotSummaryTitle')}</p>
        <p className="mt-2 text-title text-foreground">
          {dotted(blockedSlotDate(slot, localeOf(intl)), blockedSlotTimeText(intl, slot))}
        </p>
        <p className="mt-2 text-body text-muted-foreground">
          {slot.reason || text('scheduleNoReasonIndicated')}
        </p>
      </SummaryCard>
    </div>
  );
}

type SwitchPanelProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The web-visibility hint: secondary text; otherwise a bold label. */
  hint?: boolean;
  className?: string;
};

/** A switch on a muted block, with its label or hint beside it. */
function SwitchPanel({
  label,
  checked,
  onCheckedChange,
  hint = false,
  className,
}: SwitchPanelProps): ReactNode {
  return (
    <MutedPanel className={className}>
      <label className="flex cursor-pointer items-center gap-3">
        <span
          className={
            hint ? 'flex-1 text-body text-muted-foreground' : 'flex-1 text-body-strong text-foreground'
          }
        >
          {label}
        </span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </label>
    </MutedPanel>
  );
}
