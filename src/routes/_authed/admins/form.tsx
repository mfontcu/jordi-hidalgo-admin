import { createFileRoute } from '@tanstack/react-router';

import { StaffFormScreen } from '@/features/users';

export const Route = createFileRoute('/_authed/admins/form')({
  staticData: { screen: 'staffForm' },
  component: StaffFormScreen,
});
