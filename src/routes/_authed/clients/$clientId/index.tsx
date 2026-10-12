import { createFileRoute } from '@tanstack/react-router';

import { backLabelSearchSchema } from '@/features/shell';
import { ClientDetailScreen, userDetailQueryOptions } from '@/features/users';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/clients/$clientId/')({
  validateSearch: backLabelSearchSchema,
  staticData: { screen: 'clientDetail' },
  loader: ({ context, params }) => {
    void context.queryClient.query(userDetailQueryOptions(params.clientId)).catch(ignore);
  },
  component: ClientDetailScreen,
});
