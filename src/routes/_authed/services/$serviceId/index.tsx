import { createFileRoute } from '@tanstack/react-router';

import { serviceDetailQueryOptions, ServiceDetailScreen } from '@/features/services';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/services/$serviceId/')({
  staticData: { screen: 'serviceDetail' },
  loader: ({ context, params }) => {
    void context.queryClient.query(serviceDetailQueryOptions(params.serviceId)).catch(ignore);
  },
  component: ServiceDetailScreen,
});
