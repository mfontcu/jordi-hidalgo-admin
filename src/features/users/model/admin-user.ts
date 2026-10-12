/**
 * The two kinds of account the panel manages through `/admin/users`: staff (`admin`, the `/admins`
 * screens) and clients (`customer`, the `/clients` screens). The list asks for one role at a time.
 */
export type UserRole = 'admin' | 'customer';

/** An account of `/admin/users` (app_api `AdminUser`). Instants stay as the API's ISO strings. */
export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** A presigned picture URL, or empty. */
  avatarUrl: string;
  isActive: boolean;
  isBlocked: boolean;
  /** Why the account is blocked; only the detail carries it. */
  blockedReason: string;
  adminAlias: string;
  internalNotes: string;
  createdAt: string | null;
  lastAppointmentAt: string | null;
  nextAppointmentAt: string | null;
  // The rest only the detail carries: a list item reads them as missing.
  blockedAt: string | null;
  /** Names of the services the client books most. */
  frequentServices: string[];
  noShowCountLast90Days: number;
  rescheduleCountLast90Days: number;
  totalAppointments: number;
};

export type AdminUserSummary = {
  totalUsers: number;
  inactiveUsers: number;
  newThisMonth: number;
  blockedUsers: number;
  withUpcomingAppointment: number;
};

/** One page of the users list, with the summary of the role. */
export type AdminUserPage = {
  items: AdminUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  summary: AdminUserSummary;
};

/**
 * `AdminUser.fullName`: first and last name. Flutter shows "Sin nombre" (hardcoded in Spanish)
 * when both are empty; the screens show the translated message for an empty name.
 */
export function fullNameOf(user: Pick<AdminUser, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/** A contact value as the lists and the detail print it: a dash when it is empty. */
export function orDash(value: string): string {
  return value.trim() || '—';
}

/** Active staff in the summary: every account less the inactive ones (`_AdminsSummary`). */
export function activeCount(summary: AdminUserSummary): number {
  return summary.totalUsers - summary.inactiveUsers;
}

/**
 * The status pill of a staff account (AdminUserListStatusStyle.staff). In lists: active in green,
 * inactive in the muted tone, and a blocked account in red whatever its label. The detail summary
 * shows an inactive account in red.
 */
export function staffStatus(user: Pick<AdminUser, 'isActive' | 'isBlocked'>, place: 'list' | 'detail') {
  const label = user.isActive ? 'staffStatusActive' : 'staffStatusInactive';
  if (place === 'detail') return { label, tone: user.isActive ? 'success' : 'danger' } as const;
  if (user.isBlocked) return { label, tone: 'danger' } as const;
  return { label, tone: user.isActive ? 'success' : 'neutral' } as const;
}

/** The `status` values `GET /admin/users` takes (the contract's enum). */
export type UserListStatus =
  | 'all'
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'with_upcoming_appointment'
  | 'without_upcoming_appointment'
  | 'new_this_month';

/**
 * What `GET /admin/users` receives for a list screen. `status` is the role's filter (staff: all,
 * active, inactive); the dates are instants, already resolved from the date filter.
 */
export type UserListParams = {
  role: UserRole;
  page: number;
  pageSize: number;
  search: string;
  status: UserListStatus;
  dateFrom?: string;
  dateTo?: string;
};

/** The page size of the Flutter lists (AdminUsersController pagination). */
export const USERS_PAGE_SIZE = 10;
