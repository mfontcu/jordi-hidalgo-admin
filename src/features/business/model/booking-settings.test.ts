import {
  bookingSettingsFormSchema,
  bookingSettingsFormValues,
  toBookingSettingsUpdate,
  type BookingSettings,
  type BookingSettingsFormInput,
} from './booking-settings';

const settings = (): BookingSettings => ({
  id: 'booking-1',
  slotIntervalMinutes: 15,
  minCancellationNoticeMinutes: 60,
  bookingMaxAdvanceDays: 30,
  futureAppointmentLimit: 3,
  appointmentChangeLimit: 3,
  bookingFirstDate: '2026-05-01',
  bookingLastDate: '2026-12-31',
});

const errors = (value: BookingSettingsFormInput): Record<string, string> => {
  const result = bookingSettingsFormSchema.safeParse(value);
  if (result.success) return {};
  const found: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') found[field] = issue.message;
  }
  return found;
};

describe('booking settings', () => {
  it('round-trips form values and omits empty dates on update', () => {
    const values = bookingSettingsFormValues(settings());
    expect(values.slotIntervalMinutes).toBe('15');
    expect(toBookingSettingsUpdate({ ...values, bookingFirstDate: null, bookingLastDate: null })).toEqual({
      slotIntervalMinutes: 15,
      minCancellationNoticeMinutes: 60,
      bookingMaxAdvanceDays: 30,
      futureAppointmentLimit: 3,
      appointmentChangeLimit: 3,
    });
    expect(toBookingSettingsUpdate(values)).toMatchObject({
      bookingFirstDate: '2026-05-01',
      bookingLastDate: '2026-12-31',
    });
  });

  it('rejects non-positive slot and advance, and a negative notice', () => {
    const base = bookingSettingsFormValues(settings());
    expect(errors({ ...base, slotIntervalMinutes: '0' }).slotIntervalMinutes).toBe(
      'businessValidationPositiveNumber',
    );
    expect(errors({ ...base, bookingMaxAdvanceDays: '-1' }).bookingMaxAdvanceDays).toBe(
      'businessValidationPositiveNumber',
    );
    expect(errors({ ...base, minCancellationNoticeMinutes: '-5' }).minCancellationNoticeMinutes).toBe(
      'businessValidationNonNegativeNumber',
    );
    expect(errors({ ...base, slotIntervalMinutes: 'x' }).slotIntervalMinutes).toBe(
      'businessValidationValidNumber',
    );
    expect(errors({ ...base, futureAppointmentLimit: '0' }).futureAppointmentLimit).toBeUndefined();
    expect(errors({ ...base, futureAppointmentLimit: '-1' }).futureAppointmentLimit).toBe(
      'businessValidationNonNegativeNumber',
    );
    expect(errors({ ...base, futureAppointmentLimit: 'x' }).futureAppointmentLimit).toBe(
      'businessValidationValidNumber',
    );
    expect(
      toBookingSettingsUpdate({
        ...base,
        futureAppointmentLimit: '0',
        bookingFirstDate: null,
        bookingLastDate: null,
      }),
    ).toMatchObject({ futureAppointmentLimit: 0 });
    expect(errors({ ...base, appointmentChangeLimit: '0' }).appointmentChangeLimit).toBeUndefined();
    expect(errors({ ...base, appointmentChangeLimit: '-1' }).appointmentChangeLimit).toBe(
      'businessValidationNonNegativeNumber',
    );
    expect(errors({ ...base, appointmentChangeLimit: 'x' }).appointmentChangeLimit).toBe(
      'businessValidationValidNumber',
    );
    expect(
      toBookingSettingsUpdate({
        ...base,
        appointmentChangeLimit: '0',
        bookingFirstDate: null,
        bookingLastDate: null,
      }),
    ).toMatchObject({ appointmentChangeLimit: 0 });
  });

  it('rejects a first date after the last date', () => {
    const base = bookingSettingsFormValues(settings());
    expect(
      errors({ ...base, bookingFirstDate: '2026-12-31', bookingLastDate: '2026-05-01' }).bookingFirstDate,
    ).toBe('businessBookingDateRangeError');
  });
});
