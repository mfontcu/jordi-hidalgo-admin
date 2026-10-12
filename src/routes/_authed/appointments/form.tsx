import { createFileRoute } from '@tanstack/react-router';

import { AppointmentFormScreen } from '@/features/appointments';
import { appointmentFormSearchSchema } from '@/features/shell';

export const Route = createFileRoute('/_authed/appointments/form')({
  validateSearch: appointmentFormSearchSchema,
  staticData: { screen: 'appointmentForm' },
  component: AppointmentFormScreen,
});
