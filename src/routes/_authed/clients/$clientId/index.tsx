import { createFileRoute } from '@tanstack/react-router';

import { backLabelSearchSchema, RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/clients/$clientId/')({
  validateSearch: backLabelSearchSchema,
  staticData: { screen: 'clientDetail' },
  component: RoutePlaceholderScreen,
});
