import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const THEME_MODES = ['system', 'light', 'dark'] as const;

/** The staff member's appearance choice (app_core ThemeStore): `system` follows the device. */
export type ThemeMode = (typeof THEME_MODES)[number];

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'hj_admin.theme',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ mode }) => ({ mode }),
      merge: (persisted, current) => {
        const mode = (persisted as { mode?: unknown } | undefined)?.mode;
        return isThemeMode(mode) ? { ...current, mode } : current;
      },
    },
  ),
);

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The scheme a mode resolves to: `system` reads the device preference. */
export function resolveScheme(mode: ThemeMode, prefersDark: boolean): 'light' | 'dark' {
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}

/**
 * Keeps `.light` or `.dark` on `root` in line with the chosen mode and, in `system`, with the
 * device preference. Call it once before the first render, so the page never paints in the wrong
 * mode. Returns the function that stops it.
 */
export function syncThemeClass(root: HTMLElement = document.documentElement): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const apply = () => {
    const scheme = resolveScheme(useThemeStore.getState().mode, media.matches);
    root.classList.toggle('dark', scheme === 'dark');
    root.classList.toggle('light', scheme === 'light');
  };
  apply();
  media.addEventListener('change', apply);
  const unsubscribe = useThemeStore.subscribe(apply);
  return () => {
    media.removeEventListener('change', apply);
    unsubscribe();
  };
}
