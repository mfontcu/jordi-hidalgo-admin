import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  EmptyState,
  FormField,
  InfoCard,
  Input,
  LoadingBarrier,
  MutedPanel,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  Switch,
  Textarea,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useStaffForm, useStaffFormData } from '../../hooks/use-staff-form';
import type { AdminUser } from '../../model/admin-user';
import type { StaffFormInput } from '../../model/staff-form';

/** StaffAdminFormScreen's layout: compact under 960px of content. */
function formLayoutFor(width: number) {
  const compact = width < 960;
  return { compact, padding: compact ? 16 : 24 };
}

type Layout = ReturnType<typeof formLayoutFor>;

/** `/admins/form` and `/admins/{id}/form` (StaffAdminFormScreen): a new account or an edit. */
export function StaffFormScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const data = useStaffFormData();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);
  const isEdit = data.isEdit;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={intl.formatMessage({ id: isEdit ? 'staffFormEditTitle' : 'staffFormNewTitle' })}
            subtitle={intl.formatMessage({ id: isEdit ? 'staffFormEditSubtitle' : 'staffFormNewSubtitle' })}
            back={{ label: intl.formatMessage({ id: 'staffBackToList' }), onClick: data.goBack }}
            backAlign="center"
          />
          <div style={{ marginTop: width < 768 ? 12 : 24 }}>
            {data.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : data.error || data.user === undefined ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({ id: 'staffLoadError' })}
                message={describeFailure(data.error)}
                action={{
                  label: intl.formatMessage({ id: 'adminCommonRetry' }),
                  icon: 'refresh',
                  onClick: data.retry,
                }}
              />
            ) : (
              <StaffFormContent user={data.user} layout={layout} onCancel={data.goBack} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ContentProps = { user: AdminUser | null; layout: Layout; onCancel: () => void };

function StaffFormContent({ user, layout, onCancel }: ContentProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const describeFailure = useDescribeFailure();
  const form = useStaffForm({
    user,
    onSaved: (_, isEdit) => {
      showToast(text(isEdit ? 'staffUpdatedToast' : 'staffCreatedToast'));
    },
    onError: (error) => {
      showErrorToast(describeFailure(error, 'staffFormSaveFailed'));
    },
  });
  const { register, control } = form.form;
  const locked = user !== null;
  const { compact } = layout;

  const profileField = (
    name: keyof Pick<StaffFormInput, 'firstName' | 'lastName' | 'phone' | 'email'>,
    label: MessageId,
    hint: MessageId,
  ) => {
    const errorKey = form.errorKey(name);
    const id = `staff-${name}`;
    return (
      <FormField id={id} label={text(label)} error={errorKey ? text(errorKey) : undefined}>
        {/* AdminUserProfileTextField: read-only and filled on the muted surface when editing. */}
        <Input
          id={id}
          type={name === 'email' ? 'email' : 'text'}
          placeholder={text(hint)}
          readOnly={locked}
          className={cn(locked && 'bg-card')}
          aria-invalid={errorKey ? true : undefined}
          aria-describedby={errorKey ? `${id}-error` : undefined}
          {...register(name)}
        />
      </FormField>
    );
  };

  const firstName = profileField('firstName', 'clientFieldFirstName', 'clientFieldFirstNameHint');
  const lastName = profileField('lastName', 'clientFieldLastName', 'clientFieldLastNameHint');
  const phone = profileField('phone', 'appointmentFieldPhone', 'clientFieldPhoneHint');
  const email = profileField('email', 'appointmentFieldEmail', 'clientFieldEmailHint');

  const personal = (
    <InfoCard variant="elevated" title={text('staffSectionPersonalInfo')} icon="person_outline">
      {compact ? (
        <div className="flex flex-col gap-4">
          {firstName}
          {lastName}
          {phone}
          {email}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 items-start gap-3">
            {firstName}
            {lastName}
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            {phone}
            {email}
          </div>
        </div>
      )}
      {/* Flutter leaves the locked fields unexplained under 700px (approved improvement). */}
      {locked && (
        <p className="mt-4 text-caption text-muted-foreground">{text('staffFormProfileLockedHint')}</p>
      )}
    </InfoCard>
  );

  const statusAndNotes = (
    <InfoCard variant="elevated" title={text('clientStatusAndNotesTitle')} icon="sticky_note_2_outlined">
      <div className="flex flex-col gap-4">
        <Controller
          control={control}
          name="isActive"
          render={({ field: { value, onChange } }) => (
            <MutedPanel className="flex items-center gap-3 p-3.5">
              <label htmlFor="staff-isActive" className="flex-1 font-bold text-foreground">
                {text('staffAccountActiveLabel')}
              </label>
              <Switch id="staff-isActive" checked={value} onCheckedChange={onChange} />
            </MutedPanel>
          )}
        />
        <FormField id="staff-internalNotes" label={text('clientInternalNotesLabel')}>
          <Textarea
            id="staff-internalNotes"
            // TextFormField(maxLines: 5) compact, 7 otherwise: that many lines, no resizing.
            rows={compact ? 5 : 7}
            className="resize-none"
            placeholder={text('staffInternalNotesHint')}
            {...register('internalNotes')}
          />
        </FormField>
      </div>
    </InfoCard>
  );

  const save = (
    <Button type="submit" icon="save_outlined" disabled={form.isSaving} className="flex-1">
      {text(form.isSaving ? 'clientFormSaving' : 'clientFormSaveChanges')}
    </Button>
  );
  const cancel = (
    <Button variant="secondary" icon="close" disabled={form.isSaving} onClick={onCancel} className="flex-1">
      {text('adminCommonCancel')}
    </Button>
  );

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        void form.submit(event);
      }}
    >
      {compact ? (
        <div className="flex flex-col gap-4">
          {personal}
          {statusAndNotes}
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">{personal}</div>
          <div className="min-w-0 flex-1">{statusAndNotes}</div>
        </div>
      )}
      <div className={compact ? 'flex flex-col gap-3' : 'flex gap-3'}>
        {save}
        {cancel}
      </div>
      <UnsavedChangesGuard
        when={form.hasUnsavedChanges}
        labels={{
          title: text('adminUnsavedChangesTitle'),
          message: text('adminUnsavedChangesBody'),
          keepEditing: text('adminUnsavedChangesKeepEditing'),
          discard: text('adminUnsavedChangesDiscard'),
        }}
      />
      {form.isSaving && <LoadingBarrier message={text('staffFormSavingBarrier')} />}
    </form>
  );
}
