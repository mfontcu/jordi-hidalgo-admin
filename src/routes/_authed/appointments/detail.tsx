import { createFileRoute, redirect } from '@tanstack/react-router';

// Legacy path of the Flutter panel, no longer produced by its UI: opens the list instead.
export const Route = createFileRoute('/_authed/appointments/detail')({
  beforeLoad: () => {
    throw redirect({ to: '/appointments', replace: true });
  },
});
