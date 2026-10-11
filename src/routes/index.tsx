import { createFileRoute } from '@tanstack/react-router';

import { DashboardPlaceholderScreen } from '@/features/dashboard';

export const Route = createFileRoute('/')({
  component: DashboardPlaceholderScreen,
});
