import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/services/form')({
  staticData: { screen: 'serviceForm' },
  component: RoutePlaceholderScreen,
});
