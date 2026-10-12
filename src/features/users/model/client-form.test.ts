import type { AdminUser } from './admin-user';
import {
  clientCreateInput,
  clientFormDefaults,
  clientFormSchema,
  clientUpdateInput,
  isProfileLocked,
  needsDuplicatePhoneCheck,
  type ClientFormInput,
} from './client-form';

const stored: AdminUser = {
  id: 'cli-1',
  firstName: 'María',
  lastName: 'Pérez',
  phone: '+33612345678',
  email: '',
  avatarUrl: '',
  isActive: false,
  isBlocked: true,
  blockedReason: 'Impagos',
  adminAlias: 'Mari',
  internalNotes: 'VIP',
  createdAt: '2026-01-10T10:00:00Z',
  lastAppointmentAt: null,
  nextAppointmentAt: null,
  blockedAt: '2026-09-01T10:00:00Z',
  frequentServices: [],
  noShowCountLast90Days: 0,
  rescheduleCountLast90Days: 0,
  totalAppointments: 0,
};
const appUser: AdminUser = { ...stored, email: 'maria@example.com', phone: '+34 600 111 222' };

const valid: ClientFormInput = {
  firstName: ' Ana ',
  lastName: 'López ',
  adminAlias: ' Anita ',
  phone: '600 111 222',
  phoneCountry: 'ES',
  email: ' ana@example.com',
  isActive: true,
  internalNotes: ' Nueva ',
};

const errorsOf = (values: ClientFormInput, locked = false) => {
  const result = clientFormSchema(locked).safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
};

describe('client form', () => {
  it('starts a new client empty, verified, with the Spanish prefix', () => {
    expect(clientFormDefaults(null)).toEqual({
      firstName: '',
      lastName: '',
      adminAlias: '',
      phone: '',
      phoneCountry: 'ES',
      email: '',
      isActive: true,
      internalNotes: '',
    });
  });

  it('splits an editable stored phone, and keeps a locked one as stored', () => {
    expect(clientFormDefaults(stored)).toMatchObject({
      phone: '6 12 34 56 78',
      phoneCountry: 'FR',
      adminAlias: 'Mari',
    });
    expect(clientFormDefaults(appUser)).toMatchObject({ phone: '+34 600 111 222', phoneCountry: 'ES' });
    expect(isProfileLocked(appUser)).toBe(true);
    expect(isProfileLocked(stored)).toBe(false);
    expect(isProfileLocked(null)).toBe(false);
  });

  it('requires the names and a valid phone for its prefix, and an "@" in a given email', () => {
    expect(errorsOf(valid)).toEqual({});
    expect(errorsOf({ ...valid, email: '' })).toEqual({});
    expect(errorsOf({ ...valid, firstName: ' ', lastName: '', phone: '', email: 'ana' })).toEqual({
      firstName: 'clientValidationFirstNameRequired',
      lastName: 'clientValidationLastNameRequired',
      phone: 'clientValidationPhoneRequired',
      email: 'clientValidationEmailInvalid',
    });
    expect(errorsOf({ ...valid, phone: '900 111 222', phoneCountry: 'PT' })).toEqual({
      phone: 'clientValidationPhoneInvalid',
    });
  });

  it('does not validate a locked profile', () => {
    expect(errorsOf({ ...valid, firstName: '', phone: '' }, true)).toEqual({});
  });

  it('creates a customer with the E.164 phone, trimmed', () => {
    expect(clientCreateInput(valid)).toEqual({
      firstName: 'Ana',
      lastName: 'López',
      phone: '+34600111222',
      email: 'ana@example.com',
      isActive: true,
      internalNotes: 'Nueva',
      adminAlias: 'Anita',
      role: 'customer',
    });
  });

  it('updates the profile, alias, and notes, keeping the stored status and block', () => {
    expect(clientUpdateInput(stored, valid)).toEqual({
      firstName: 'Ana',
      lastName: 'López',
      phone: '+34600111222',
      email: 'ana@example.com',
      isActive: false,
      isBlocked: true,
      blockedReason: 'Impagos',
      internalNotes: 'Nueva',
      adminAlias: 'Anita',
    });
  });

  it('keeps the stored profile of a client who uses the app', () => {
    expect(clientUpdateInput(appUser, { ...valid, firstName: 'Otra' })).toMatchObject({
      firstName: 'María',
      lastName: 'Pérez',
      phone: '+34 600 111 222',
      email: 'maria@example.com',
      adminAlias: 'Anita',
    });
  });

  it('checks for duplicates only when an editable phone changed', () => {
    expect(needsDuplicatePhoneCheck(valid, null)).toBe(true);
    expect(needsDuplicatePhoneCheck({ ...valid, phone: '6 12 34 56 78', phoneCountry: 'FR' }, stored)).toBe(
      false,
    );
    expect(needsDuplicatePhoneCheck(valid, stored)).toBe(true);
    expect(needsDuplicatePhoneCheck(valid, appUser)).toBe(false);
  });
});
