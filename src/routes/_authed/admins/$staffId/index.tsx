import { createFileRoute } from '@tanstack/react-router';

import { StaffDetailScreen, userDetailQueryOptions } from '@/features/users';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/admins/$staffId/')({
  staticData: { screen: 'staffDetail' },
  loader: ({ context, params }) => {
    void context.queryClient.query(userDetailQueryOptions(params.staffId)).catch(ignore);
  },
  component: StaffDetailScreen,
});
