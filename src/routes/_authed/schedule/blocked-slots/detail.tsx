import { createFileRoute, redirect } from '@tanstack/react-router';

// Legacy path of the Flutter panel, no longer produced by its UI: opens the list instead.
export const Route = createFileRoute('/_authed/schedule/blocked-slots/detail')({
  beforeLoad: () => {
    throw redirect({ to: '/schedule/blocked-slots', replace: true });
  },
});
