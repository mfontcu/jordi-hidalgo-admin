import { createFileRoute, redirect } from '@tanstack/react-router';

// Legacy path of the Flutter panel, no longer produced by its UI: opens the list instead.
export const Route = createFileRoute('/_authed/clients/detail')({
  beforeLoad: () => {
    throw redirect({ to: '/clients', replace: true });
  },
});
