import { activeCount, fullNameOf, orDash, staffStatus } from './admin-user';

describe('admin user presentation', () => {
  it('joins first and last name, and leaves an empty name for the screens to fill', () => {
    expect(fullNameOf({ firstName: 'Jordi', lastName: 'Hidalgo' })).toBe('Jordi Hidalgo');
    expect(fullNameOf({ firstName: 'Jordi', lastName: '' })).toBe('Jordi');
    expect(fullNameOf({ firstName: ' ', lastName: '' })).toBe('');
  });

  it('prints a dash for an empty contact value', () => {
    expect(orDash('600 000 000')).toBe('600 000 000');
    expect(orDash('  ')).toBe('—');
  });

  it('counts active staff as every account less the inactive ones', () => {
    expect(
      activeCount({
        totalUsers: 5,
        inactiveUsers: 2,
        newThisMonth: 1,
        blockedUsers: 0,
        withUpcomingAppointment: 0,
      }),
    ).toBe(3);
  });

  it('presents the staff status as the Flutter list and detail do', () => {
    expect(staffStatus({ isActive: true, isBlocked: false }, 'list')).toEqual({
      label: 'staffStatusActive',
      tone: 'success',
    });
    expect(staffStatus({ isActive: false, isBlocked: false }, 'list')).toEqual({
      label: 'staffStatusInactive',
      tone: 'neutral',
    });
    // A blocked account turns red in lists, whatever its label.
    expect(staffStatus({ isActive: true, isBlocked: true }, 'list')).toEqual({
      label: 'staffStatusActive',
      tone: 'danger',
    });
    expect(staffStatus({ isActive: false, isBlocked: false }, 'detail')).toEqual({
      label: 'staffStatusInactive',
      tone: 'danger',
    });
  });
});
