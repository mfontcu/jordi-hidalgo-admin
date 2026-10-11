import { createFileRoute } from '@tanstack/react-router';

import {
  listParamsOf,
  serviceCategoriesQueryOptions,
  servicesListQueryOptions,
  servicesSearchSchema,
  ServicesScreen,
} from '@/features/services';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/services/')({
  staticData: { screen: 'services' },
  validateSearch: servicesSearchSchema,
  // Starts the requests on hover and on entry; the screen shows its own loading and errors.
  loaderDeps: ({ search }) => listParamsOf(search),
  loader: ({ context, deps }) => {
    void context.queryClient.query(servicesListQueryOptions(deps)).catch(ignore);
    void context.queryClient.query(serviceCategoriesQueryOptions()).catch(ignore);
  },
  component: ServicesScreen,
});
