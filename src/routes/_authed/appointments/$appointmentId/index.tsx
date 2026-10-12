import { createFileRoute } from '@tanstack/react-router';

import {
  AppointmentDetailScreen,
  appointmentDetailQueryOptions,
  customerPushMessagesQueryOptions,
} from '@/features/appointments';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/appointments/$appointmentId/')({
  staticData: { screen: 'appointmentDetail' },
  loader: ({ context, params }) => {
    void context.queryClient.query(appointmentDetailQueryOptions(params.appointmentId)).catch(ignore);
    void context.queryClient.query(customerPushMessagesQueryOptions(params.appointmentId)).catch(ignore);
  },
  component: AppointmentDetailScreen,
});
