import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import type { Locale, Messages } from '@/shared/i18n';
import ca from '@/shared/i18n/messages/ca.json';
import en from '@/shared/i18n/messages/en.json';
import es from '@/shared/i18n/messages/es.json';

const messagesByLocale: Record<Locale, Messages> = { es, ca, en };

type Options = RenderOptions & { locale?: Locale };

/** Renders with the app's providers: real messages for the locale and a fresh query client. */
export function renderWithProviders(ui: ReactElement, { locale = 'es', ...options }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale={locale} defaultLocale="es" messages={messagesByLocale[locale]}>
        {children}
      </IntlProvider>
    </QueryClientProvider>
  );
  return render(ui, { wrapper, ...options });
}
