import { createFileRoute } from '@tanstack/react-router';

import { DashboardPlaceholderScreen } from '@/features/dashboard';

// Any other path needs a session too (Flutter `isAuthenticatedShellRoute`), so a deep link to a
// section reaches the guard and comes back after sign-in. Phase 3 registers the real sections;
// this route then becomes the signed-in "not found" screen.
export const Route = createFileRoute('/_authed/$')({
  component: DashboardPlaceholderScreen,
});
