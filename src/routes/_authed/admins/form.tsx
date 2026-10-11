import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/admins/form')({
  staticData: { screen: 'staffForm' },
  component: RoutePlaceholderScreen,
});
