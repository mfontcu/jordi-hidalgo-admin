import { createFileRoute } from '@tanstack/react-router';

import { NotFoundScreen } from '@/features/shell';

// Any other path needs a session too (Flutter `isAuthenticatedShellRoute`), so a deep link reaches
// the guard first; with a session it is the "not found" screen inside the shell.
export const Route = createFileRoute('/_authed/$')({
  component: NotFoundScreen,
});
