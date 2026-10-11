import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectLocale, isLocale, type Locale } from './locales';

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

/**
 * Staff member's language: the chosen one, else the browser's. Only a choice is stored, so a
 * detected language follows the browser on the next visit. Read outside React by the HTTP client
 * (`Accept-Language`).
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(navigator.languages),
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
