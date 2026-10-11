import { canAccessAdmin } from './staff-member';

// Same cases as app_models AuthUser.canAccessAdmin.
describe('canAccessAdmin', () => {
  it.each(['admin', 'super_admin'])('lets %s in', (role) => {
    expect(canAccessAdmin(role)).toBe(true);
  });

  it.each(['customer', '', 'Admin'])('keeps %j out', (role) => {
    expect(canAccessAdmin(role)).toBe(false);
  });
});
