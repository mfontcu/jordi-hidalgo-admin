import { createFileRoute } from '@tanstack/react-router';

import { clientFormSearchSchema } from '@/features/shell';
import { ClientFormScreen } from '@/features/users';

export const Route = createFileRoute('/_authed/clients/form')({
  validateSearch: clientFormSearchSchema,
  staticData: { screen: 'clientForm' },
  component: ClientFormScreen,
});
