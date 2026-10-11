import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/availability')({
  staticData: { screen: 'availability' },
  component: RoutePlaceholderScreen,
});
