import { createFileRoute } from '@tanstack/react-router';

import { businessSearchSchema, RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/business')({
  validateSearch: businessSearchSchema,
  staticData: { screen: 'business' },
  component: RoutePlaceholderScreen,
});
