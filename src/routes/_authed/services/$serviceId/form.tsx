import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/services/$serviceId/form')({
  staticData: { screen: 'serviceForm' },
  component: RoutePlaceholderScreen,
});
