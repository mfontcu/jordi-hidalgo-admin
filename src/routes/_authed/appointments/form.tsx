import { createFileRoute } from '@tanstack/react-router';

import { appointmentFormSearchSchema, RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/appointments/form')({
  validateSearch: appointmentFormSearchSchema,
  staticData: { screen: 'appointmentForm' },
  component: RoutePlaceholderScreen,
});
