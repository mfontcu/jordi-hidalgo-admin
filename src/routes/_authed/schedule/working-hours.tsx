import { createFileRoute } from '@tanstack/react-router';

import { workingHoursQueryOptions, WorkingHoursScreen } from '@/features/schedule';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/working-hours')({
  staticData: { screen: 'workingHours' },
  loader: ({ context }) => {
    void context.queryClient.query(workingHoursQueryOptions()).catch(ignore);
  },
  component: WorkingHoursScreen,
});
