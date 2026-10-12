import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import type { CountryLocale } from '@/shared/lib/countries';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FormField,
  InfoCard,
  Input,
  LoadingBarrier,
  MutedPanel,
  PageHeader,
  PhoneField,
  showErrorToast,
  showToast,
  Spinner,
  Switch,
  Textarea,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useClientForm, useClientFormData } from '../../hooks/use-client-form';
import type { AdminUser } from '../../model/admin-user';
import { clientStatus } from '../../model/client';
import type { ClientFormInput } from '../../model/client-form';

/** ClientFormScreen's layout: compact under 960px of content. */
function formLayoutFor(width: number) {
  const compact = width < 960;
  return { compact, padding: compact ? 16 : 24, titleSize: compact ? 24 : 30 };
}

type Layout = ReturnType<typeof formLayoutFor>;

/** `/clients/form` and `/clients/{id}/form` (ClientFormScreen): a new client or an edit. */
export function ClientFormScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const data = useClientFormData();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);
  const backLabel =
    data.backLabel ??
    intl.formatMessage({
      // An edit goes back to the detail it came from; Flutter labels it "back to clients" (approved
      // change).
      id: data.fromAppointment
        ? 'appointmentFormBackToAppointment'
        : data.isEdit
          ? 'clientBackToDetail'
          : 'clientBackToList',
    });
  // The subtitle explains what can change (Flutter shows it from 700px).
  const subtitle: MessageId = !data.isEdit
    ? 'clientFormNewSubtitle'
    : data.user?.email.trim()
      ? 'clientEditProfileLockedHint'
      : 'clientEditProfileNoEmailHint';

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={intl.formatMessage({ id: data.isEdit ? 'clientFormEditTitle' : 'clientFormNewTitle' })}
            subtitle={intl.formatMessage({ id: subtitle })}
            titleSize={layout.titleSize}
            subtitleSize={14}
            back={{ label: backLabel, onClick: data.goBack }}
            backAlign="center"
          />
          <div style={{ marginTop: width < 700 ? 12 : 24 }}>
            {data.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : data.error || data.user === undefined ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({ id: 'clientLoadError' })}
                message={describeFailure(data.error)}
                action={{
                  label: intl.formatMessage({ id: 'adminCommonRetry' }),
                  icon: 'refresh',
                  onClick: data.retry,
                }}
              />
            ) : (
              <ClientFormContent user={data.user} layout={layout} onCancel={data.goBack} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ContentProps = { user: AdminUser | null; layout: Layout; onCancel: () => void };

function ClientFormContent({ user, layout, onCancel }: ContentProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const describeFailure = useDescribeFailure();
  const form = useClientForm({
    user,
    onSaved: (_, isEdit) => {
      showToast(text(isEdit ? 'clientUpdatedToast' : 'clientCreatedToast'));
    },
    onError: (error) => {
      showErrorToast(describeFailure(error, 'clientFormSaveFailed'));
    },
  });
  const { register, control } = form.form;
  const { locked } = form;
  const { compact } = layout;

  const errorOf = (name: keyof ClientFormInput) => {
    const key = form.errorKey(name);
    return key ? text(key) : undefined;
  };
  const described = (id: string, error: string | undefined) => ({
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  });

  const profileField = (
    name: keyof Pick<ClientFormInput, 'firstName' | 'lastName' | 'email'>,
    label: MessageId,
    hint: MessageId,
  ) => {
    const id = `client-${name}`;
    const error = errorOf(name);
    return (
      <FormField id={id} label={text(label)} error={error}>
        {/* AdminUserProfileTextField: read-only and filled on the muted surface when locked. */}
        <Input
          id={id}
          type={name === 'email' ? 'email' : 'text'}
          placeholder={text(hint)}
          readOnly={locked}
          className={cn(locked && 'bg-surface-muted')}
          {...described(id, error)}
          {...register(name)}
        />
      </FormField>
    );
  };

  const firstName = profileField('firstName', 'clientFieldFirstName', 'clientFieldFirstNameHint');
  const lastName = profileField('lastName', 'clientFieldLastName', 'clientFieldLastNameHint');
  const email = profileField(
    'email',
    locked ? 'appointmentFieldEmail' : 'clientFieldEmailOptional',
    'clientFieldEmailHint',
  );
  const alias = (
    <FormField id="client-adminAlias" label={text('clientFieldAliasAdminOnly')}>
      <Input id="client-adminAlias" placeholder={text('clientFieldAliasHint')} {...register('adminAlias')} />
    </FormField>
  );
  const phoneError = errorOf('phone');
  const phone = (
    <FormField id="client-phone" label={text('appointmentFieldPhone')} error={phoneError}>
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <Controller
            control={control}
            name="phoneCountry"
            render={({ field: country }) => (
              <PhoneField
                id="client-phone"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                country={country.value}
                onCountryChange={country.onChange}
                locale={intl.locale as CountryLocale}
                readOnly={locked}
                placeholder={text(locked ? 'clientFieldPhoneHint' : 'clientFieldPhoneNationalHint')}
                labels={{
                  pickerTitle: text('clientCountryPickerTitle'),
                  pickerSearch: text('clientCountryPickerSearchHint'),
                  pickerEmpty: text('phoneCountryNotFound'),
                  close: text('adminCommonClose'),
                  changeCountry: (selected) =>
                    intl.formatMessage({ id: 'phoneCountryChange' }, { country: selected }),
                }}
                {...described('client-phone', phoneError)}
              />
            )}
          />
        )}
      />
    </FormField>
  );

  const personal = (
    <InfoCard variant="elevated" title={text('clientSectionPersonalInfo')} icon="person_outline">
      {compact ? (
        <div className="flex flex-col gap-4">
          {firstName}
          {lastName}
          {alias}
          {phone}
          {email}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 items-start gap-3">
            {firstName}
            {lastName}
          </div>
          {alias}
          <div className="grid grid-cols-2 items-start gap-3">
            {phone}
            {email}
          </div>
        </div>
      )}
    </InfoCard>
  );

  // `_buildStatusField`: an edit shows the account status, which it keeps; a new client gets the
  // switch. Flutter also shows the switch when editing a client without an email, where it does
  // nothing (approved change).
  const status = user ? clientStatus(user) : null;
  const statusField = status ? (
    <MutedPanel className="flex items-center gap-3 p-3.5">
      <span className="flex-1 font-bold text-on-surface">{text('clientAccountStatusTitle')}</span>
      <span className="font-bold text-content-secondary">{text(status.label)}</span>
    </MutedPanel>
  ) : (
    <Controller
      control={control}
      name="isActive"
      render={({ field: { value, onChange } }) => (
        <MutedPanel className="flex items-center gap-3 p-3.5">
          <label htmlFor="client-isActive" className="flex-1 font-bold text-on-surface">
            {text('clientActiveOnCreate')}
          </label>
          <Switch id="client-isActive" checked={value} onCheckedChange={onChange} />
        </MutedPanel>
      )}
    />
  );

  const statusAndNotes = (
    <InfoCard variant="elevated" title={text('clientStatusAndNotesTitle')} icon="sticky_note_2_outlined">
      <div className="flex flex-col gap-4">
        {statusField}
        <FormField id="client-internalNotes" label={text('clientInternalNotesLabel')}>
          <Textarea
            id="client-internalNotes"
            // TextFormField(maxLines: 5) compact, 7 otherwise: that many lines, no resizing.
            rows={compact ? 5 : 7}
            className="resize-none"
            placeholder={text('clientInternalNotesHint')}
            {...register('internalNotes')}
          />
        </FormField>
      </div>
    </InfoCard>
  );

  const busy = form.isSaving || form.isChecking;
  const save = (
    <Button type="submit" icon="save_outlined" disabled={busy} className="flex-1">
      {text(form.isSaving ? 'clientFormSaving' : 'clientFormSaveChanges')}
    </Button>
  );
  const cancel = (
    <Button variant="secondary" icon="close" disabled={busy} onClick={onCancel} className="flex-1">
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
      <ConfirmDialog
        open={form.duplicatePhone}
        onOpenChange={(open) => {
          if (!open) form.dismissDuplicate();
        }}
        tone="emphasized"
        title={text('clientPhoneDuplicateTitle')}
        message={text('clientPhoneDuplicateBody')}
        confirmLabel={text('clientPhoneDuplicateConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={form.confirmDuplicate}
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
      {form.isSaving && <LoadingBarrier message={text('clientFormSavingBarrier')} />}
    </form>
  );
}
