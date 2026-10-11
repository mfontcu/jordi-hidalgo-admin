import { createRouter } from '@tanstack/react-router';

import { queryClient } from './query-client';
import { routeTree } from './routeTree.gen';
import { wireSessionExpiry } from './session-expiry';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // Freshness is TanStack Query's job; the router always asks the loaders.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

wireSessionExpiry(router, queryClient);

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface
  interface Register {
    router: typeof router;
  }
}
