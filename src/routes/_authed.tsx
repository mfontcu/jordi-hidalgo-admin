import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { restoreSession, SessionRestoringScreen } from '@/features/auth';

// Route guard: replaces the Flutter panel's /auth-gate. Without a usable session, goes to /login
// with the requested path, which sign-in opens afterwards.
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const staffMember = await restoreSession(context.queryClient);
    if (!staffMember) {
      throw redirect({ to: '/login', search: { redirect: location.href }, replace: true });
    }
    return { staffMember };
  },
  pendingComponent: SessionRestoringScreen,
  component: Outlet,
});
