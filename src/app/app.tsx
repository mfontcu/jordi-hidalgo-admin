import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, Suspense } from 'react';

import { I18nProvider } from '@/shared/i18n';

import { queryClient } from './query-client';
import { router } from './router';

export function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <I18nProvider>
            <RouterProvider router={router} />
          </I18nProvider>
        </Suspense>
      </QueryClientProvider>
    </StrictMode>
  );
}
