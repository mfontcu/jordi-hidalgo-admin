import type { MockBackend } from './backend';

type StoredUser = {
  id: string;
  role: 'admin' | 'customer';
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  isBlocked: boolean;
  blockedReason: string;
  adminAlias: string;
  internalNotes: string;
  createdAt: string;
  lastAppointmentAt: string;
  nextAppointmentAt: string;
  totalAppointments: number;
};

const account = (
  fields: Partial<StoredUser> & Pick<StoredUser, 'id' | 'role' | 'firstName' | 'lastName'>,
) => ({
  phone: '',
  email: '',
  isActive: true,
  isBlocked: false,
  blockedReason: '',
  adminAlias: '',
  internalNotes: '',
  createdAt: '2026-01-10T10:00:00Z',
  lastAppointmentAt: '',
  nextAppointmentAt: '',
  totalAppointments: 0,
  ...fields,
});

/**
 * The accounts of `/admin/users`, mocked with state: writes change what later reads return, and
 * the list answers the `role`, `status`, and `search` it is asked for.
 */
export function mockUsers(backend: MockBackend) {
  const users: StoredUser[] = [
    account({
      id: 'usr-1',
      role: 'admin',
      firstName: 'Jordi',
      lastName: 'Hidalgo',
      phone: '+34 600 000 001',
      email: 'jordi@example.com',
      internalNotes: 'Dueño del salón',
    }),
    account({
      id: 'usr-2',
      role: 'admin',
      firstName: 'Ana',
      lastName: 'López',
      phone: '+34 600 000 002',
      email: 'ana@example.com',
      isActive: false,
      createdAt: '2026-09-15T08:00:00Z',
    }),
    account({
      id: 'c-1',
      role: 'customer',
      firstName: 'María',
      lastName: 'Pérez',
      phone: '+34600111222',
      email: 'maria@example.com',
      adminAlias: 'Mari',
      internalNotes: 'Alérgica al tinte',
      createdAt: '2026-02-03T10:00:00Z',
      lastAppointmentAt: '2026-01-15T09:00:00Z',
      totalAppointments: 3,
    }),
    account({
      id: 'c-2',
      role: 'customer',
      firstName: 'Luis',
      lastName: 'Gómez',
      phone: '+34600333444',
      isActive: false,
    }),
  ];

  const dto = (user: StoredUser) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    return {
      ...user,
      fullName,
      displayName: user.adminAlias || fullName,
      avatarUrl: '',
      blockedAt: user.isBlocked ? '2026-10-12T08:00:00Z' : '',
      frequentServices: [],
      noShowCountLast90Days: 0,
      rescheduleCountLast90Days: 0,
    };
  };
  const find = (id: string) => users.find((user) => user.id === id);
  const STATUS: Record<string, (user: StoredUser) => boolean> = {
    active: (user) => user.isActive,
    inactive: (user) => !user.isActive,
    blocked: (user) => user.isBlocked,
  };

  backend.on('GET', '/admin/users', (request) => {
    const query = new URL(request.url()).searchParams;
    const role = query.get('role') ?? 'customer';
    const status = STATUS[query.get('status') ?? ''] ?? (() => true);
    const search = (query.get('search') ?? '').toLowerCase();
    const ofRole = users.filter((user) => user.role === role);
    const items = ofRole
      .filter(status)
      .filter((user) => !search || `${user.firstName} ${user.lastName}`.toLowerCase().includes(search))
      .map(dto);
    return {
      json: {
        items,
        pagination: { page: 1, pageSize: 10, totalItems: items.length, totalPages: 1 },
        summary: {
          totalUsers: ofRole.length,
          inactiveUsers: ofRole.filter((user) => !user.isActive).length,
          newThisMonth: 0,
          blockedUsers: ofRole.filter((user) => user.isBlocked).length,
          withUpcomingAppointment: 0,
        },
      },
    };
  });

  backend.on('GET', '/admin/users/phone-matches', (request) => {
    const query = new URL(request.url()).searchParams;
    const phone = query.get('phone') ?? '';
    const exclude = query.get('excludeUserId') ?? '';
    const count = users.filter(
      (user) => user.role === 'customer' && user.id !== exclude && user.phone === phone,
    ).length;
    return { json: { count } };
  });

  backend.on('POST', '/admin/users', (request) => {
    const body = request.postDataJSON() as Omit<StoredUser, 'id' | 'createdAt'>;
    const ofRole = users.filter((user) => user.role === body.role).length;
    const created = account({
      id: `${body.role === 'customer' ? 'c' : 'usr'}-${ofRole + 1}`,
      role: body.role,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      isActive: body.isActive,
      adminAlias: body.adminAlias,
      internalNotes: body.internalNotes,
      createdAt: '2026-10-11T09:00:00Z',
    });
    users.push(created);
    mockUser(created.id);
    return { status: 201, json: dto(created) };
  });

  const mockUser = (id: string) => {
    backend.on('GET', `/admin/users/${id}`, () => {
      const user = find(id);
      return user ? { json: dto(user) } : { status: 404, text: 'user not found' };
    });
    // The update replaces every field it receives.
    backend.on('PATCH', `/admin/users/${id}`, (request) => {
      const user = find(id);
      if (!user) return { status: 404, text: 'user not found' };
      Object.assign(user, request.postDataJSON() as Partial<StoredUser>);
      return { json: dto(user) };
    });
    backend.on('POST', `/admin/users/${id}/password-setup-email`, { status: 204, text: '' });
    backend.on('POST', `/admin/users/${id}/activation-email`, { status: 204, text: '' });
    backend.on('POST', `/admin/users/${id}/verify-account`, () => {
      const user = find(id);
      if (!user) return { status: 404, text: 'user not found' };
      user.isActive = true;
      return { json: dto(user) };
    });
    backend.on('DELETE', `/admin/users/${id}`, () => {
      const index = users.findIndex((user) => user.id === id);
      if (index < 0) return { status: 404, text: 'user not found' };
      users.splice(index, 1);
      return { status: 204, text: '' };
    });
  };
  for (const user of users) mockUser(user.id);

  return users;
}
