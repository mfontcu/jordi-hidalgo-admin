import { z } from 'zod';

import type { AdminUser } from './admin-user';

/** The staff form (StaffAdminFormScreen): profile, status, and notes. */
export type StaffFormInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  internalNotes: string;
};

/** `POST /admin/users`, in view-model terms. */
export type CreateUserInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  internalNotes: string;
  adminAlias: string;
  role: 'admin' | 'customer';
};

/** `PATCH /admin/users/{id}`, in view-model terms: the request replaces every field. */
export type UpdateUserInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  isBlocked: boolean;
  blockedReason: string;
  internalNotes: string;
  adminAlias: string;
};

export type StaffFormErrorKey =
  | 'clientValidationFirstNameRequired'
  | 'clientValidationLastNameRequired'
  | 'clientValidationPhoneRequired'
  | 'clientValidationEmailRequired'
  | 'clientValidationEmailInvalid';

// An empty field reports only that it is required, not the checks after it.
const required = (message: StaffFormErrorKey) => z.string().trim().min(1, { message, abort: true });

/**
 * A new staff account, validated on submit: every profile field, and an email with an "@" (the
 * Flutter check).
 */
export const staffCreateSchema = z.object({
  firstName: required('clientValidationFirstNameRequired'),
  lastName: required('clientValidationLastNameRequired'),
  phone: required('clientValidationPhoneRequired'),
  email: required('clientValidationEmailRequired').refine(
    (value) => value.includes('@'),
    'clientValidationEmailInvalid',
  ),
  isActive: z.boolean(),
  internalNotes: z.string(),
});

/** Editing locks the profile fields (read-only, unvalidated): only status and notes change. */
export const staffEditSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string(),
  isActive: z.boolean(),
  internalNotes: z.string(),
});

/** The new account, trimmed, with the `admin` role. */
export function staffCreateInput(values: StaffFormInput): CreateUserInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    isActive: values.isActive,
    internalNotes: values.internalNotes.trim(),
    adminAlias: '',
    role: 'admin',
  };
}

/**
 * The update of a staff account: its stored profile, block, and alias with the form's status and
 * notes. The request replaces every field; Flutter sends no block and no alias, which clears them.
 */
export function staffUpdateInput(
  user: AdminUser,
  values: Pick<StaffFormInput, 'isActive' | 'internalNotes'>,
): UpdateUserInput {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    isActive: values.isActive,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason,
    internalNotes: values.internalNotes.trim(),
    adminAlias: user.adminAlias,
  };
}

/** The form's starting values: empty and active for a new account, the stored ones to edit. */
export function staffFormDefaults(user: AdminUser | null): StaffFormInput {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    isActive: user?.isActive ?? true,
    internalNotes: user?.internalNotes ?? '',
  };
}
