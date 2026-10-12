import { createFileRoute } from '@tanstack/react-router';

import {
  AvailabilityOverviewScreen,
  availabilityDatesQueryOptions,
  availabilitySearchSchema,
  availabilityServicesQueryOptions,
  availabilitySlotsQueryOptions,
} from '@/features/availability';
import { businessToday } from '@/shared/lib/business-time';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/availability')({
  staticData: { screen: 'availability' },
  validateSearch: availabilitySearchSchema,
  loaderDeps: ({ search }) => ({
    serviceId: search.serviceId ?? '',
    day: search.day ?? businessToday(),
  }),
  loader: ({ context, deps }) => {
    void context.queryClient.query(availabilityServicesQueryOptions()).catch(ignore);
    if (deps.serviceId) {
      void context.queryClient.query(availabilityDatesQueryOptions(deps.serviceId)).catch(ignore);
      void context.queryClient.query(availabilitySlotsQueryOptions(deps.serviceId, deps.day)).catch(ignore);
    }
  },
  component: AvailabilityOverviewScreen,
});
