import type { UserAppointmentsParams } from '../model/appointment';

/** Query keys of the appointments feature. A status change invalidates `lists()`. */
export const appointmentsKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentsKeys.all, 'list'] as const,
  userList: (params: UserAppointmentsParams) => [...appointmentsKeys.lists(), 'user', params] as const,
};
