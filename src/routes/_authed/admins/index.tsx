import { createFileRoute } from '@tanstack/react-router';

import { staffListParamsOf, staffSearchSchema, StaffScreen, usersListQueryOptions } from '@/features/users';
import { businessToday } from '@/shared/lib/business-time';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/admins/')({
  staticData: { screen: 'staff' },
  validateSearch: staffSearchSchema,
  // Starts the request on hover and on entry; the screen shows its own loading and errors.
  loaderDeps: ({ search }) => staffListParamsOf(search, businessToday()),
  loader: ({ context, deps }) => {
    void context.queryClient.query(usersListQueryOptions(deps)).catch(ignore);
  },
  component: StaffScreen,
});
