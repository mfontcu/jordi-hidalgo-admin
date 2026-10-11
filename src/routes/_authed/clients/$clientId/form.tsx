import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/clients/$clientId/form')({
  staticData: { screen: 'clientForm' },
  component: RoutePlaceholderScreen,
});
