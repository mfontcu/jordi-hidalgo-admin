import type { components } from '@/shared/api';

import type { StaffMember } from '../model/staff-member';

type AuthUserDto = components['schemas']['dto.AuthUserResponse'];

export function toStaffMember(dto: AuthUserDto): StaffMember {
  return {
    id: dto.id ?? '',
    email: dto.email ?? '',
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    role: dto.role ?? '',
  };
}
