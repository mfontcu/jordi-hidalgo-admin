import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { addDays, addMonths, businessToday } from '@/shared/lib/business-time';
import {
  Button,
  DateInputField,
  FormField,
  InfoCard,
  Input,
  showErrorToast,
  showToast,
  UnsavedChangesGuard,
} from '@/shared/ui';

import { useBookingSettings } from '../../hooks/use-booking-settings';
import type { BookingSettings } from '../../model/booking-settings';
import { dateInputLabels, localeOf, textOf } from '../shared/labels';

type BookingTabProps = { settings: BookingSettings };

/** Slot interval, cancellation notice, advance days, and optional first/last bookable dates. */
export function BookingTab({ settings }: BookingTabProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const form = useBookingSettings(settings, {
    onSaved: () => {
      showToast(text('businessBookingSettingsSaved'));
    },
    onError: (error) => {
      showErrorToast(describeFailure(error, 'businessBookingSettingsSaveError'));
    },
  });
  const { register, control } = form.form;
  const today = businessToday();
  const first = '2025-01-01';
  const last = addMonths(today, 36);
  const labels = dateInputLabels(intl);
  const language = localeOf(intl);

  const numberError = (
    field: 'slotIntervalMinutes' | 'minCancellationNoticeMinutes' | 'bookingMaxAdvanceDays',
  ) => {
    const key = form.errorKey(field);
    return key ? text(key) : undefined;
  };

  return (
    <div className="flex flex-col gap-6">
      <UnsavedChangesGuard
        when={form.hasUnsavedChanges}
        labels={{
          title: text('legalUnsavedChangesTitle'),
          message: text('legalUnsavedChangesBody'),
          keepEditing: text('legalKeepEditing'),
          discard: text('legalDiscard'),
        }}
      />

      <InfoCard title={text('businessBookingSettingsTitle')} icon="event_available_outlined">
        <p className="mb-4 text-body-md text-content-secondary">{text('businessBookingSettingsSubtitle')}</p>
        <div className="flex flex-col gap-4">
          <FormField
            id="booking-slot-interval"
            label={text('businessBookingSlotIntervalMinutes')}
            error={numberError('slotIntervalMinutes')}
          >
            <Input id="booking-slot-interval" inputMode="numeric" {...register('slotIntervalMinutes')} />
          </FormField>
          <FormField
            id="booking-min-cancellation"
            label={text('businessBookingMinCancellationNoticeMinutes')}
            error={numberError('minCancellationNoticeMinutes')}
          >
            <Input
              id="booking-min-cancellation"
              inputMode="numeric"
              {...register('minCancellationNoticeMinutes')}
            />
          </FormField>
          <FormField
            id="booking-max-advance"
            label={text('businessBookingMaxAdvanceDays')}
            error={numberError('bookingMaxAdvanceDays')}
          >
            <Input id="booking-max-advance" inputMode="numeric" {...register('bookingMaxAdvanceDays')} />
          </FormField>

          <Controller
            control={control}
            name="bookingFirstDate"
            render={({ field }) => (
              <FormField
                id="booking-first-date"
                label={text('businessBookingFirstDateLabel')}
                hint={text('businessBookingFirstDateHint')}
                error={(() => {
                  const key = form.errorKey('bookingFirstDate');
                  return key ? text(key) : undefined;
                })()}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <DateInputField
                      id="booking-first-date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={text('businessBookingNoRestriction')}
                      initialDay={field.value ?? today}
                      first={first}
                      last={last}
                      language={language}
                      labels={labels}
                      invalid={Boolean(form.errorKey('bookingFirstDate'))}
                    />
                  </div>
                  {field.value && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        field.onChange(null);
                      }}
                    >
                      {text('adminCommonClear')}
                    </Button>
                  )}
                </div>
              </FormField>
            )}
          />

          <Controller
            control={control}
            name="bookingLastDate"
            render={({ field }) => (
              <FormField
                id="booking-last-date"
                label={text('businessBookingLastDateLabel')}
                hint={text('businessBookingLastDateHint')}
                error={(() => {
                  const key = form.errorKey('bookingLastDate');
                  return key ? text(key) : undefined;
                })()}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <DateInputField
                      id="booking-last-date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={text('businessBookingNoLimit')}
                      initialDay={field.value ?? addDays(today, 30)}
                      first={first}
                      last={last}
                      language={language}
                      labels={labels}
                      invalid={Boolean(form.errorKey('bookingLastDate'))}
                    />
                  </div>
                  {field.value && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        field.onChange(null);
                      }}
                    >
                      {text('adminCommonClear')}
                    </Button>
                  )}
                </div>
              </FormField>
            )}
          />
        </div>
      </InfoCard>

      <div>
        <Button
          type="button"
          loading={form.isSaving}
          onClick={() => {
            void form.submit();
          }}
        >
          {form.isSaving ? text('businessBookingSaving') : text('businessBookingSave')}
        </Button>
      </div>
    </div>
  );
}
