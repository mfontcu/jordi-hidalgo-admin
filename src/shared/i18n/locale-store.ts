import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

/** Staff member's chosen language. Read outside React by the HTTP client (`Accept-Language`). */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'hj_admin.locale',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale }) => ({ locale }),
      merge: (persisted, current) => {
        const locale = (persisted as { locale?: unknown } | undefined)?.locale;
        return isLocale(locale) ? { ...current, locale } : current;
      },
    },
  ),
);
