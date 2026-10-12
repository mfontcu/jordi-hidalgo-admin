import { createFileRoute } from '@tanstack/react-router';

import { AppointmentRescheduleScreen, appointmentDetailQueryOptions } from '@/features/appointments';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/appointments/$appointmentId/reschedule')({
  staticData: { screen: 'appointmentReschedule' },
  loader: ({ context, params }) => {
    void context.queryClient.query(appointmentDetailQueryOptions(params.appointmentId)).catch(ignore);
  },
  component: AppointmentRescheduleScreen,
});
