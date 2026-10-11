import type { QueryClient } from '@tanstack/react-query';

import { session } from '@/shared/api';

import type { router as appRouter } from './router';

/**
 * When the client expires the session (refresh rejected, user blocked), drops every cached query of
 * the session and opens the login screen with the current path (Flutter `AdminSessionListener`).
 */
export function wireSessionExpiry(router: typeof appRouter, queryClient: QueryClient) {
  return session.onExpired(() => {
    queryClient.clear();
    const location = router.latestLocation;
    if (location.pathname === '/login') return;
    void router.navigate({ to: '/login', search: { redirect: location.href }, replace: true });
  });
}
