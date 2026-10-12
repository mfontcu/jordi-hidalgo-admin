import { createFileRoute } from '@tanstack/react-router';

import { DashboardScreen, dashboardSummaryQueryOptions } from '@/features/dashboard';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/')({
  staticData: { screen: 'dashboard' },
  loader: ({ context }) => {
    void context.queryClient.query(dashboardSummaryQueryOptions()).catch(ignore);
  },
  component: DashboardScreen,
});
