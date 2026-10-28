import { useIntl } from 'react-intl';

import { ClientOperationalBanner } from '@/features/users';
import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import {
  Button,
  EmptyState,
  FormField,
  InfoCard,
  LoadingBarrier,
  LookupField,
  LookupList,
  MutedPanel,
  PageHeader,
  SearchField,
  showErrorToast,
  Spinner,
  Switch,
  Textarea,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useAppointmentForm } from '../hooks/use-appointment-form';
import { SlotTakenMeanwhileError } from '../model/appointment';
import { TimeSlotPicker } from './time-slot-picker';

function formLayoutFor(width: number) {
  if (width < 640) return { padding: 16, gap: 20, twoColumns: false };
  if (width < 1040) return { padding: 20, gap: 22, twoColumns: false };
  return { padding: 24, gap: 24, twoColumns: true };
}

/** `/appointments/form` (AppointmentFormScreen). */
export function AppointmentFormScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);
  const form = useAppointmentForm({
    onSuccess: () => undefined,
    onError: (error) =>
      showErrorToast(
        error instanceof SlotTakenMeanwhileError
          ? `${intl.formatMessage({ id: 'appointmentFormSaveFailed' })} ${intl.formatMessage({ id: 'appointmentSlotTakenMeanwhile' })}`
          : describeFailure(error, 'appointmentFormSaveFailed'),
      ),
    onValidation: (message) => showErrorToast(intl.formatMessage({ id: message })),
  });
  const text = (id: MessageId) => intl.formatMessage({ id });
  const backLabel = form.backLabel ?? text('appointmentBackToList');

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={text('appointmentFormNewTitle')}
            subtitle={text('appointmentFormNewSubtitle')}
            back={{ label: backLabel, onClick: form.goBack }}
          />
          <form
            className="flex flex-col gap-5"
            style={{ marginTop: width < 768 ? 12 : layout.gap }}
            onSubmit={(event) => {
              event.preventDefault();
              form.submit();
            }}
          >
            {form.servicesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : form.servicesError ? (
              <EmptyState
                icon="error_outline"
                title={text('appointmentFormServiceNotFound')}
                message={describeFailure(form.servicesError)}
                action={{
                  label: text('adminCommonRetry'),
                  icon: 'refresh',
                  onClick: form.retryServices,
                }}
              />
            ) : (
              <>
                <InfoCard title={text('appointmentFormSectionData')} icon="event_outlined">
                  <div className="flex flex-col gap-4">
                    <LookupField
                      id="appointment-client"
                      label={text('appointmentFormClientOptional')}
                      value={form.clientLabel}
                      placeholder={intl.formatMessage(
                        { id: 'appointmentLookupSelectHint' },
                        { field: text('appointmentFormClientOptional').toLowerCase() },
                      )}
                      open={form.clientOpen}
                      onOpenChange={form.setClientOpen}
                      onClear={form.locked ? undefined : form.clearClient}
                      labels={{
                        open: intl.formatMessage(
                          { id: 'appointmentLookupSearchTooltip' },
                          { field: text('appointmentGenericClient').toLowerCase() },
                        ),
                        clear: intl.formatMessage(
                          { id: 'appointmentLookupClearTooltip' },
                          { field: text('appointmentGenericClient').toLowerCase() },
                        ),
                      }}
                    >
                      <div className="border-b border-border p-2">
                        <SearchField
                          value={form.clientSearchText}
                          onValueChange={form.setClientSearchText}
                          placeholder={text('appointmentListSearchHint')}
                          aria-label={text('appointmentListSearchHint')}
                          clearLabel={text('adminCommonClearSearch')}
                        />
                      </div>
                      <LookupList
                        label={text('appointmentFormClientOptional')}
                        options={form.clientOptions}
                        onSelect={(id) => {
                          const option = form.clientOptions.find((item) => item.id === id);
                          if (option) form.selectClient(option.id, option.title);
                        }}
                        empty={text('appointmentFormNoMatches')}
                      />
                    </LookupField>
                    {!form.locked && (
                      <Button
                        type="button"
                        variant="secondary"
                        icon="person_add_outlined"
                        onClick={form.createClient}
                      >
                        {text('appointmentFormCreateClient')}
                      </Button>
                    )}
                    {form.clientDetailLoading && (
                      <p className="text-label text-muted-foreground">
                        {text('appointmentClientOperationalLoading')}
                      </p>
                    )}
                    {form.clientDetail && <ClientOperationalBanner user={form.clientDetail} />}

                    <LookupField
                      id="appointment-service"
                      label={text('appointmentFormServiceLabel')}
                      value={form.selectedService?.name ?? ''}
                      placeholder={intl.formatMessage(
                        { id: 'appointmentLookupSelectHint' },
                        { field: text('appointmentFormServiceLabel').toLowerCase() },
                      )}
                      open={form.serviceOpen}
                      onOpenChange={form.setServiceOpen}
                      labels={{
                        open: intl.formatMessage(
                          { id: 'appointmentLookupSearchTooltip' },
                          { field: text('appointmentFormServiceLabel').toLowerCase() },
                        ),
                        clear: intl.formatMessage(
                          { id: 'appointmentLookupClearTooltip' },
                          { field: text('appointmentFormServiceLabel').toLowerCase() },
                        ),
                      }}
                    >
                      <div className="border-b border-border p-2">
                        <SearchField
                          value={form.serviceSearchText}
                          onValueChange={form.setServiceSearchText}
                          placeholder={text('serviceSearchHint')}
                          aria-label={text('serviceSearchHint')}
                          clearLabel={text('adminCommonClearSearch')}
                        />
                      </div>
                      <LookupList
                        label={text('appointmentFormServiceLabel')}
                        options={form.serviceOptions}
                        onSelect={form.selectService}
                        empty={text('serviceListEmptyMessage')}
                      />
                    </LookupField>

                    <TimeSlotPicker
                      day={form.day}
                      time={form.time}
                      durationMinutes={form.selectedService?.durationMinutes ?? 0}
                      availableDates={form.availableDates}
                      slots={form.slots}
                      datesLoading={form.datesLoading}
                      slotsLoading={form.slotsLoading}
                      emptyDatesMessage={text('appointmentFormNoDatesAvailable')}
                      onDayChange={form.setDay}
                      onTimeChange={form.setTime}
                    />
                  </div>
                </InfoCard>

                <InfoCard title={text('appointmentFormSectionStatusNotes')} icon="sticky_note_2_outlined">
                  <div className="flex flex-col gap-4">
                    <MutedPanel className="flex items-center justify-between gap-3 p-4">
                      <p className="text-body-strong text-foreground">
                        {text(form.confirmed ? 'appointmentFormConfirmed' : 'appointmentFormPending')}
                      </p>
                      <Switch
                        aria-label={text('appointmentFormConfirmed')}
                        checked={form.confirmed}
                        onCheckedChange={form.setConfirmed}
                      />
                    </MutedPanel>
                    <FormField id="appointment-internal-notes" label={text('appointmentFormNotesLabel')}>
                      <Textarea
                        id="appointment-internal-notes"
                        rows={4}
                        placeholder={text('appointmentFormNotesHint')}
                        {...form.form.register('internalNotes')}
                      />
                    </FormField>
                  </div>
                </InfoCard>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" icon="save_outlined" loading={form.isSaving}>
                    {text(form.isSaving ? 'appointmentFormSaving' : 'appointmentFormSave')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={form.goBack}>
                    {text('adminCommonCancel')}
                  </Button>
                </div>
              </>
            )}
            {form.isSaving && <LoadingBarrier message={text('appointmentFormSavingBarrier')} />}
            <UnsavedChangesGuard
              when={form.isDirty}
              labels={{
                title: text('adminUnsavedChangesTitle'),
                message: text('adminUnsavedChangesBody'),
                keepEditing: text('adminUnsavedChangesKeepEditing'),
                discard: text('adminUnsavedChangesDiscard'),
              }}
            />
          </form>
        </div>
      )}
    </div>
  );
}
