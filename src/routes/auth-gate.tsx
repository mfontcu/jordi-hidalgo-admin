import { createFileRoute, redirect } from '@tanstack/react-router';

// The Flutter panel's session-restore screen. The route guard does its job now; an old link lands
// on the dashboard, or on the login screen without a session.
export const Route = createFileRoute('/auth-gate')({
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true });
  },
});
