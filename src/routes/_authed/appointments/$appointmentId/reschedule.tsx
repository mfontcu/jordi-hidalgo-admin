import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/appointments/$appointmentId/reschedule')({
  staticData: { screen: 'appointmentReschedule' },
  component: RoutePlaceholderScreen,
});
