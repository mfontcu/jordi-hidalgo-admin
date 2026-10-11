import { createFileRoute } from '@tanstack/react-router';

import {
  serviceCategoriesQueryOptions,
  serviceDetailQueryOptions,
  ServiceFormScreen,
} from '@/features/services';

// New version of a service: the form, prefilled from it.
// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/services/$serviceId/form')({
  staticData: { screen: 'serviceForm' },
  loader: ({ context, params }) => {
    void context.queryClient.query(serviceDetailQueryOptions(params.serviceId)).catch(ignore);
    void context.queryClient.query(serviceCategoriesQueryOptions()).catch(ignore);
  },
  component: ServiceFormScreen,
});
