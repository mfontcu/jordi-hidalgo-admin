import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/clients/')({
  staticData: { screen: 'clients' },
  component: RoutePlaceholderScreen,
});
