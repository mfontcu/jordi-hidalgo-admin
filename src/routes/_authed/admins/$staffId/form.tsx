import { createFileRoute } from '@tanstack/react-router';

import { StaffFormScreen, userDetailQueryOptions } from '@/features/users';

// Edit a staff account: status and notes; the profile is read-only.
// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/admins/$staffId/form')({
  staticData: { screen: 'staffForm' },
  loader: ({ context, params }) => {
    void context.queryClient.query(userDetailQueryOptions(params.staffId)).catch(ignore);
  },
  component: StaffFormScreen,
});
