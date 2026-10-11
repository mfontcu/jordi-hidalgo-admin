import { createContext, useContext } from 'react';

/**
 * Element that overlays (dialogs, sheets, popovers, menus, tooltips) render into. By default they
 * render into document.body; a subtree that sets its own mode (.light or .dark) provides an element
 * inside it, so its overlays inherit that mode's tokens.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined;
}
