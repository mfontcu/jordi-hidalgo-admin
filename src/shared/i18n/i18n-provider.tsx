import { use, useEffect, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import { useLocaleStore } from './locale-store';
import { DEFAULT_LOCALE } from './locales';
import { loadMessages } from './messages';

/** Provides the chosen locale's messages. Suspends while they load. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((state) => state.locale);
  const messages = use(loadMessages(locale));

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
      {children}
    </IntlProvider>
  );
}
