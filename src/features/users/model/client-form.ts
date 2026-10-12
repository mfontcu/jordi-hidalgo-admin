import { z } from 'zod';

import {
  DEFAULT_PHONE_COUNTRY,
  phoneE164OrNull,
  samePhone,
  splitStoredPhone,
  validatePhone,
} from '@/shared/lib/phone';

import type { AdminUser } from './admin-user';
import { usesApp } from './client';
import type { CreateUserInput, UpdateUserInput } from './staff-form';

/** The client form (ClientFormScreen): profile with the phone prefix, alias, status, and notes. */
export type ClientFormInput = {
  firstName: string;
  lastName: string;
  adminAlias: string;
  /** The national number as typed, or the stored number when the profile is locked. */
  phone: string;
  /** ISO code of the phone prefix. */
  phoneCountry: string;
  email: string;
  isActive: boolean;
  internalNotes: string;
};

export type ClientFormErrorKey =
  | 'clientValidationFirstNameRequired'
  | 'clientValidationLastNameRequired'
  | 'clientValidationPhoneRequired'
  | 'clientValidationPhoneInvalid'
  | 'clientValidationEmailInvalid';

/** Editing a client who uses the app locks the profile (`_profileLocked`): name, phone, and email. */
export function isProfileLocked(user: AdminUser | null): boolean {
  return user !== null && usesApp(user);
}

const required = (message: ClientFormErrorKey) => z.string().refine((value) => value.trim() !== '', message);

/**
 * The form validated on submit. An editable profile needs both names and a valid phone for its
 * prefix, and an email, when given, needs an "@" (the Flutter checks). A locked profile is not
 * validated: its fields are read-only, as Flutter skips their validators.
 */
export function clientFormSchema(locked: boolean) {
  if (locked) {
    return z.object({
      firstName: z.string(),
      lastName: z.string(),
      adminAlias: z.string(),
      phone: z.string(),
      phoneCountry: z.string(),
      email: z.string(),
      isActive: z.boolean(),
      internalNotes: z.string(),
    });
  }
  return z
    .object({
      firstName: required('clientValidationFirstNameRequired'),
      lastName: required('clientValidationLastNameRequired'),
      adminAlias: z.string(),
      phone: z.string(),
      phoneCountry: z.string(),
      email: z.string().refine((value) => {
        const email = value.trim();
        return email === '' || email.includes('@');
      }, 'clientValidationEmailInvalid'),
      isActive: z.boolean(),
      internalNotes: z.string(),
    })
    .superRefine((values, context) => {
      const error = validatePhone(values.phone, values.phoneCountry);
      if (error) {
        context.addIssue({
          code: 'custom',
          path: ['phone'],
          message: error === 'empty' ? 'clientValidationPhoneRequired' : 'clientValidationPhoneInvalid',
        });
      }
    });
}

/**
 * The starting values: empty, verified, and the Spanish prefix for a new client. To edit, the
 * stored values; an editable phone is split into its prefix and national number.
 */
export function clientFormDefaults(user: AdminUser | null): ClientFormInput {
  const stored =
    user && !isProfileLocked(user)
      ? splitStoredPhone(user.phone)
      : { country: DEFAULT_PHONE_COUNTRY, national: user?.phone ?? '' };
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    adminAlias: user?.adminAlias ?? '',
    phone: stored.national,
    phoneCountry: stored.country,
    email: user?.email ?? '',
    isActive: user?.isActive ?? true,
    internalNotes: user?.internalNotes ?? '',
  };
}

/** The phone the request carries (`_phoneForSubmit`): the stored one when locked, else E.164. */
export function clientPhoneOf(values: ClientFormInput, user: AdminUser | null): string {
  if (user && isProfileLocked(user)) return user.phone;
  return phoneE164OrNull(values.phone, values.phoneCountry) ?? values.phone.trim();
}

/**
 * Whether saving first counts other clients with the phone (`phone-matches`): only an editable
 * phone that changed.
 */
export function needsDuplicatePhoneCheck(values: ClientFormInput, user: AdminUser | null): boolean {
  if (isProfileLocked(user)) return false;
  return !samePhone(clientPhoneOf(values, user), user?.phone ?? '');
}

/** The new client, trimmed, with the `customer` role. */
export function clientCreateInput(values: ClientFormInput): CreateUserInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: clientPhoneOf(values, null),
    email: values.email.trim(),
    isActive: values.isActive,
    internalNotes: values.internalNotes.trim(),
    adminAlias: values.adminAlias.trim(),
    role: 'customer',
  };
}

/**
 * The update of a client: the form's profile (or the stored one when locked), alias, and notes,
 * with the stored status and block. The request replaces every field, as Flutter sends it.
 */
export function clientUpdateInput(user: AdminUser, values: ClientFormInput): UpdateUserInput {
  const locked = isProfileLocked(user);
  return {
    firstName: locked ? user.firstName : values.firstName.trim(),
    lastName: locked ? user.lastName : values.lastName.trim(),
    phone: clientPhoneOf(values, user),
    email: locked ? user.email : values.email.trim(),
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason,
    internalNotes: values.internalNotes.trim(),
    adminAlias: values.adminAlias.trim(),
  };
}
