import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { LoginScreen, postSignInPath, restoreSession } from '@/features/auth';

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  // With a session, the login screen is skipped (Flutter `resolveBrowserRoute`): also on Back.
  beforeLoad: async ({ context, search }) => {
    if (await restoreSession(context.queryClient)) {
      throw redirect({ href: postSignInPath(search.redirect), replace: true });
    }
  },
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect: requested } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <LoginScreen onSignedIn={() => void navigate({ href: postSignInPath(requested), replace: true })} />;
}
