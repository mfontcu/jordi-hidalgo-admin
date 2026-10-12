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
  });

  it('rejects a first date after the last date', () => {
    const base = bookingSettingsFormValues(settings());
    expect(
      errors({ ...base, bookingFirstDate: '2026-12-31', bookingLastDate: '2026-05-01' }).bookingFirstDate,
    ).toBe('businessBookingDateRangeError');
  });
});
