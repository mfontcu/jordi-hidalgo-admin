import { createFileRoute } from '@tanstack/react-router';

import {
  AppointmentsScreen,
  appointmentsListQueryOptions,
  appointmentsSearchSchema,
  listParamsOf,
} from '@/features/appointments';
import { businessToday } from '@/shared/lib/business-time';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/appointments/')({
  staticData: { screen: 'appointments' },
  validateSearch: appointmentsSearchSchema,
  loaderDeps: ({ search }) => listParamsOf(search, businessToday()),
  loader: ({ context, deps }) => {
    void context.queryClient.query(appointmentsListQueryOptions(deps)).catch(ignore);
  },
  component: AppointmentsScreen,
});
