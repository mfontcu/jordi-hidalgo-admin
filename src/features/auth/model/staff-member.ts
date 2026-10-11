/** The signed-in user, as `GET /auth/me` and `POST /auth/login` return it. */
export type StaffMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

// Source: app_models AuthUser.canAccessAdmin (jordi_hidalgo_app/packages/app_models/lib/src/auth_user.dart).
const ADMIN_ROLES: readonly string[] = ['admin', 'super_admin'];

/** Only staff roles may use the panel; a customer account is signed out. */
export function canAccessAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}
