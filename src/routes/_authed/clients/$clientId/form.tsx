import { createFileRoute } from '@tanstack/react-router';

import { ClientFormScreen, userDetailQueryOptions } from '@/features/users';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/clients/$clientId/form')({
  staticData: { screen: 'clientForm' },
  loader: ({ context, params }) => {
    void context.queryClient.query(userDetailQueryOptions(params.clientId)).catch(ignore);
  },
  component: ClientFormScreen,
});
