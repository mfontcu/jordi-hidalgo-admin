import type { components } from '@/shared/api';

import type { AdminUser, AdminUserPage } from '../model/admin-user';

type UserDto =
  | components['schemas']['dto.AdminUserDetailResponse']
  | components['schemas']['dto.AdminUserListItemResponse'];
type UserListDto = components['schemas']['dto.AdminUserListResponse'];

export function toAdminUser(dto: UserDto): AdminUser {
  return {
    id: dto.id ?? '',
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    phone: dto.phone ?? '',
    email: dto.email ?? '',
    avatarUrl: dto.avatarUrl ?? '',
    isActive: dto.isActive ?? false,
    isBlocked: dto.isBlocked ?? false,
    blockedReason: 'blockedReason' in dto ? (dto.blockedReason ?? '') : '',
    adminAlias: dto.adminAlias ?? '',
    internalNotes: 'internalNotes' in dto ? (dto.internalNotes ?? '') : '',
    // The backend sends an empty string for a missing instant.
    createdAt: dto.createdAt?.trim() ? dto.createdAt : null,
  };
}

export function toAdminUserPage(dto: UserListDto): AdminUserPage {
  return {
    items: (dto.items ?? []).map(toAdminUser),
    page: dto.pagination?.page ?? 1,
    pageSize: dto.pagination?.pageSize ?? 0,
    totalItems: dto.pagination?.totalItems ?? 0,
    summary: {
      totalUsers: dto.summary?.totalUsers ?? 0,
      inactiveUsers: dto.summary?.inactiveUsers ?? 0,
      newThisMonth: dto.summary?.newThisMonth ?? 0,
      blockedUsers: dto.summary?.blockedUsers ?? 0,
      withUpcomingAppointment: dto.summary?.withUpcomingAppointment ?? 0,
    },
  };
}
