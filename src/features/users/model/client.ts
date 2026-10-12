import { fullNameOf, type AdminUser } from './admin-user';
import type { UpdateUserInput } from './staff-form';

// Clients: the rules app_api's AdminUser derives (repositories/admin_users_repository.dart) and
// the client status of the lists and the detail (client_filter_labels.dart).

/** AdminUser.noShowRiskThreshold: no-shows in 90 days from which a client is a risk. */
export const NO_SHOW_RISK_THRESHOLD = 2;

/** The alias the salon gave the client, trimmed; empty when there is none. */
export function aliasOf(user: Pick<AdminUser, 'adminAlias'>): string {
  return user.adminAlias.trim();
}

/**
 * `displayName`: the alias, or else the name in the app. Empty when there is neither; the screens
 * show the translated "No name" then (Flutter hardcodes "Sin nombre").
 */
export function displayNameOf(user: Pick<AdminUser, 'adminAlias' | 'firstName' | 'lastName'>): string {
  return aliasOf(user) || fullNameOf(user);
}

/** `canBook`: a verified client who is not blocked can get a new appointment. */
export function canBook(user: Pick<AdminUser, 'isActive' | 'isBlocked'>): boolean {
  return user.isActive && !user.isBlocked;
}

export function isNoShowRisk(user: Pick<AdminUser, 'noShowCountLast90Days'>): boolean {
  return user.noShowCountLast90Days >= NO_SHOW_RISK_THRESHOLD;
}

/** `hasOperationalAlerts`: a no-show risk or internal notes, which the appointment form warns about. */
export function hasOperationalAlerts(
  user: Pick<AdminUser, 'noShowCountLast90Days' | 'internalNotes'>,
): boolean {
  return isNoShowRisk(user) || user.internalNotes.trim() !== '';
}

/**
 * A client with an email uses the app: the salon cannot edit the profile, only the alias, notes,
 * and status, and the account gets the activation and password emails.
 */
export function usesApp(user: Pick<AdminUser, 'email'>): boolean {
  return user.email.trim() !== '';
}

/**
 * clientUserStatusLabel and its colors (AdminUserListStatusStyle.client): blocked in red, verified
 * in green, unverified in the muted tone, the same in the lists and the detail.
 */
export function clientStatus(user: Pick<AdminUser, 'isActive' | 'isBlocked'>): {
  label: 'clientStatusBlocked' | 'clientStatusVerified' | 'clientStatusUnverified';
  tone: 'danger' | 'success' | 'neutral';
} {
  if (user.isBlocked) return { label: 'clientStatusBlocked', tone: 'danger' };
  if (user.isActive) return { label: 'clientStatusVerified', tone: 'success' };
  return { label: 'clientStatusUnverified', tone: 'neutral' };
}

/**
 * Blocking or unblocking from the detail: the stored account with the new block. Kept apart from
 * the form, so the detail does not load the phone metadata.
 */
export function clientBlockInput(user: AdminUser, block: { reason: string } | null): UpdateUserInput {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    isActive: user.isActive,
    isBlocked: block !== null,
    blockedReason: block?.reason ?? '',
    internalNotes: user.internalNotes,
    adminAlias: user.adminAlias,
  };
}
