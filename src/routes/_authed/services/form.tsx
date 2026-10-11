import { createFileRoute } from '@tanstack/react-router';

import { serviceCategoriesQueryOptions, ServiceFormScreen } from '@/features/services';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/services/form')({
  staticData: { screen: 'serviceForm' },
  loader: ({ context }) => {
    void context.queryClient.query(serviceCategoriesQueryOptions()).catch(ignore);
  },
  component: ServiceFormScreen,
});
