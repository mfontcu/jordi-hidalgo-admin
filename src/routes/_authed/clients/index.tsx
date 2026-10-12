import { createFileRoute } from '@tanstack/react-router';

import {
  clientsListParamsOf,
  clientsSearchSchema,
  ClientsScreen,
  usersListQueryOptions,
} from '@/features/users';
import { businessToday } from '@/shared/lib/business-time';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/clients/')({
  staticData: { screen: 'clients' },
  validateSearch: clientsSearchSchema,
  // Starts the request on hover and on entry; the screen shows its own loading and errors.
  loaderDeps: ({ search }) => clientsListParamsOf(search, businessToday()),
  loader: ({ context, deps }) => {
    void context.queryClient.query(usersListQueryOptions(deps)).catch(ignore);
  },
  component: ClientsScreen,
});
