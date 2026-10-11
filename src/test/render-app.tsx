import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { routeTree } from '@/app/routeTree.gen';
import { wireSessionExpiry } from '@/app/session-expiry';
import es from '@/shared/i18n/messages/es.json';

/**
 * Renders the whole panel (real route tree, guards, and session-expiry wiring) at `path`, with
 * Spanish messages and memory history. Call `unmount` when done, so its expiry listener goes away.
 */
export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  const unwire = wireSessionExpiry(router, queryClient);

  const view = render(
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="es" defaultLocale="es" messages={es}>
        <RouterProvider router={router} />
      </IntlProvider>
    </QueryClientProvider>,
  );

  return {
    ...view,
    router,
    queryClient,
    unmount: () => {
      unwire();
      view.unmount();
    },
  };
}
