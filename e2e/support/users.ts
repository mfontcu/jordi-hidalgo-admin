import type { MockBackend } from './backend';

type StoredUser = {
  id: string;
  role: 'admin' | 'customer';
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isActive: boolean;
  internalNotes: string;
  createdAt: string;
};

/**
 * The accounts of `/admin/users`, mocked with state: writes change what later reads return, and
 * the list answers the `role`, `status`, and `search` it is asked for.
 */
export function mockUsers(backend: MockBackend) {
  const users: StoredUser[] = [
    {
      id: 'usr-1',
      role: 'admin',
      firstName: 'Jordi',
      lastName: 'Hidalgo',
      phone: '+34 600 000 001',
      email: 'jordi@example.com',
      isActive: true,
      internalNotes: 'Dueño del salón',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'usr-2',
      role: 'admin',
      firstName: 'Ana',
      lastName: 'López',
      phone: '+34 600 000 002',
      email: 'ana@example.com',
      isActive: false,
      internalNotes: '',
      createdAt: '2026-09-15T08:00:00Z',
    },
  ];

  const dto = (user: StoredUser) => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    displayName: `${user.firstName} ${user.lastName}`,
    adminAlias: '',
    avatarUrl: '',
    isBlocked: false,
  });
  const find = (id: string) => users.find((user) => user.id === id);

  backend.on('GET', '/admin/users', (request) => {
    const query = new URL(request.url()).searchParams;
    const role = query.get('role') ?? 'customer';
    const status = query.get('status');
    const search = (query.get('search') ?? '').toLowerCase();
    const ofRole = users.filter((user) => user.role === role);
    const items = ofRole
      .filter((user) => status !== 'active' || user.isActive)
      .filter((user) => status !== 'inactive' || !user.isActive)
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
          blockedUsers: 0,
          withUpcomingAppointment: 0,
        },
      },
    };
  });

  backend.on('POST', '/admin/users', (request) => {
    const body = request.postDataJSON() as Omit<StoredUser, 'id' | 'createdAt'>;
    const created: StoredUser = {
      id: `usr-${users.length + 1}`,
      role: body.role,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      isActive: body.isActive,
      internalNotes: body.internalNotes,
      createdAt: '2026-10-11T09:00:00Z',
    };
    users.push(created);
    mockUser(created.id);
    return { status: 201, json: dto(created) };
  });

  const mockUser = (id: string) => {
    backend.on('GET', `/admin/users/${id}`, () => {
      const user = find(id);
      return user ? { json: dto(user) } : { status: 404, text: 'user not found' };
    });
    backend.on('PATCH', `/admin/users/${id}`, (request) => {
      const user = find(id);
      if (!user) return { status: 404, text: 'user not found' };
      const body = request.postDataJSON() as Partial<StoredUser>;
      Object.assign(user, {
        isActive: body.isActive ?? user.isActive,
        internalNotes: body.internalNotes ?? user.internalNotes,
      });
      return { json: dto(user) };
    });
    backend.on('POST', `/admin/users/${id}/password-setup-email`, { status: 204, text: '' });
  };
  for (const user of users) mockUser(user.id);

  return users;
}
