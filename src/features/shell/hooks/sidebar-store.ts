import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SidebarState = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

/**
 * Whether the full sidebar is collapsed (AdminSidebarStore). Kept as a preference, so it also
 * survives a reload, which the Flutter panel did not do.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: 'hj_admin.sidebar_collapsed',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ collapsed }) => ({ collapsed }),
      merge: (persisted, current) => {
        const collapsed = (persisted as { collapsed?: unknown } | undefined)?.collapsed;
        return typeof collapsed === 'boolean' ? { ...current, collapsed } : current;
      },
    },
  ),
);
