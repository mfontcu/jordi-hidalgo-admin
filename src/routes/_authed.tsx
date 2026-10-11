import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { restoreSession, SessionRestoringScreen } from '@/features/auth';
import { AppShell, sidebarSearchSchema } from '@/features/shell';

// Route guard: replaces the Flutter panel's /auth-gate. Without a usable session, goes to /login
// with the requested path, which sign-in opens afterwards. With one, renders the shell; every
// signed-in route may carry `?sidebar=`.
export const Route = createFileRoute('/_authed')({
  validateSearch: sidebarSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const staffMember = await restoreSession(context.queryClient);
    if (!staffMember) {
      throw redirect({ to: '/login', search: { redirect: location.href }, replace: true });
    }
    return { staffMember };
  },
  pendingComponent: SessionRestoringScreen,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
