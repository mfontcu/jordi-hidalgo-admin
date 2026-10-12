import { parsePhone, phoneE164OrNull, samePhone, splitStoredPhone, validatePhone } from './phone';

// The cases of app_core test/phone_number_test.dart, then the paths of tryParseRegisterPhone.
describe('phone numbers (app_core phone_number.dart)', () => {
  it('turns a Spanish national number into E.164 with the selected prefix', () => {
    expect(phoneE164OrNull('600 111 222', 'ES')).toBe('+34600111222');
  });

  it('splits a stored phone into its country and national number', () => {
    const parts = splitStoredPhone('+33612345678');
    expect(parts).toEqual({ country: 'FR', national: '6 12 34 56 78' });
    expect(phoneE164OrNull(parts.national, parts.country)).toBe('+33612345678');
  });

  it('reports an empty phone and rejects a short one', () => {
    expect(validatePhone('')).toBe('empty');
    expect(validatePhone('   ')).toBe('empty');
    expect(phoneE164OrNull('12')).toBeNull();
    expect(validatePhone('12')).toBe('invalid');
  });

  it('reads an international number whatever the selected country', () => {
    expect(phoneE164OrNull('+44 20 7946 0958', 'ES')).toBe('+442079460958');
    expect(phoneE164OrNull('0033 6 12 34 56 78', 'ES')).toBe('+33612345678');
  });

  it('reads a national number of the selected country, then one without its "+"', () => {
    expect(phoneE164OrNull('06 12 34 56 78', 'FR')).toBe('+33612345678');
    expect(phoneE164OrNull('33612345678', 'ES')).toBe('+33612345678');
  });

  it('validates against the country patterns, not only the length', () => {
    // Nine digits, but no Spanish number starts with 5 followed by these.
    expect(parsePhone('500 000 000', 'ES')).toBeNull();
    expect(validatePhone('600 000 001', 'ES')).toBeNull();
  });

  it('keeps an unreadable stored phone as text, with Spain', () => {
    expect(splitStoredPhone('call me')).toEqual({ country: 'ES', national: 'call me' });
    expect(splitStoredPhone('')).toEqual({ country: 'ES', national: '' });
  });

  it('compares the digits of two phones', () => {
    expect(samePhone('+34 600 111 222', '+34600111222')).toBe(true);
    expect(samePhone('+34 600 111 222', '+34600111223')).toBe(false);
    expect(samePhone('', '')).toBe(false);
  });
});
