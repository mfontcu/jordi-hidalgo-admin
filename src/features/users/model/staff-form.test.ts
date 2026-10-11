import type { AdminUser } from './admin-user';
import {
  staffCreateInput,
  staffCreateSchema,
  staffEditSchema,
  staffFormDefaults,
  staffUpdateInput,
  type StaffFormInput,
} from './staff-form';

const user: AdminUser = {
  id: 'usr-1',
  firstName: 'Jordi',
  lastName: 'Hidalgo',
  phone: '+34 600 000 000',
  email: 'jordi@example.com',
  avatarUrl: '',
  isActive: true,
  isBlocked: true,
  blockedReason: 'Revisión',
  adminAlias: 'Jordi H.',
  internalNotes: 'Dueño',
  createdAt: '2026-01-10T10:00:00Z',
};

const valid: StaffFormInput = {
  firstName: ' Ana ',
  lastName: 'López',
  phone: '600 111 222',
  email: 'ana@example.com ',
  isActive: true,
  internalNotes: ' turno de tarde ',
};

const errorsOf = (values: StaffFormInput): Record<string, string> => {
  const result = staffCreateSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
};

describe('staff form', () => {
  it('requires every profile field and an email with an @ to create', () => {
    expect(errorsOf({ ...valid, firstName: ' ', lastName: '', phone: '', email: '' })).toEqual({
      firstName: 'clientValidationFirstNameRequired',
      lastName: 'clientValidationLastNameRequired',
      phone: 'clientValidationPhoneRequired',
      email: 'clientValidationEmailRequired',
    });
    expect(errorsOf({ ...valid, email: 'ana.example.com' })).toEqual({
      email: 'clientValidationEmailInvalid',
    });
    expect(errorsOf(valid)).toEqual({});
  });

  it('creates an admin account with trimmed values and no alias', () => {
    expect(staffCreateInput(valid)).toEqual({
      firstName: 'Ana',
      lastName: 'López',
      phone: '600 111 222',
      email: 'ana@example.com',
      isActive: true,
      internalNotes: 'turno de tarde',
      adminAlias: '',
      role: 'admin',
    });
  });

  it('does not validate the locked profile when editing', () => {
    expect(staffEditSchema.safeParse({ ...valid, firstName: '', email: 'x' }).success).toBe(true);
  });

  it('updates with the stored profile, block, and alias, and the new status and notes', () => {
    expect(staffUpdateInput(user, { isActive: false, internalNotes: ' baja temporal ' })).toEqual({
      firstName: 'Jordi',
      lastName: 'Hidalgo',
      phone: '+34 600 000 000',
      email: 'jordi@example.com',
      isActive: false,
      isBlocked: true,
      blockedReason: 'Revisión',
      internalNotes: 'baja temporal',
      adminAlias: 'Jordi H.',
    });
  });

  it('starts empty and active for a new account, and from the account to edit', () => {
    expect(staffFormDefaults(null)).toEqual({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      isActive: true,
      internalNotes: '',
    });
    expect(staffFormDefaults(user)).toMatchObject({ firstName: 'Jordi', internalNotes: 'Dueño' });
  });
});
