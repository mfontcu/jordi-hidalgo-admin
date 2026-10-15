import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { signOut } from '@/features/auth';
import { Drawer, DrawerContent, DrawerTitle, Toaster, TooltipProvider } from '@/shared/ui';

import { useSidebarStore } from '../hooks/sidebar-store';
import { useShellLayout } from '../hooks/use-shell-layout';
import type { ShellLayout } from '../model/layout';
import { MobileHeader } from './mobile-header';
import { Sidebar } from './sidebar';

/**
 * Signed-in layout. Under 768px a drawer and the mobile header; 768–1023px a 60px icon rail whose
 * labeled sidebar is an overlay (it does not push the page, and it does not write the desktop
 * collapse preference); from 1024px the 240px sidebar, which staff can collapse. The content keeps
 * its place in the tree across layouts, so resizing never resets a screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const layout = useShellLayout();
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState<ShellLayout>(layout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (menuLayout !== layout) {
    setMenuLayout(layout);
    setMenuOpen(false);
  }

  // Sign-out from the sidebar: back to the login screen, no notice.
  const handleSignOut = () => {
    setMenuOpen(false);
    signOut(queryClient);
    void navigate({ to: '/login', replace: true });
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const mobile = layout === 'mobile';
  const tablet = layout === 'tablet';

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh bg-background">
        {!mobile && (
          <Sidebar
            compact={tablet || collapsed}
            onToggleCollapse={layout === 'desktop' ? toggleCollapsed : undefined}
            onOpenOverlay={
              tablet
                ? () => {
                    setMenuOpen(true);
                  }
                : undefined
            }
            onSignOut={handleSignOut}
            className="sticky top-0 h-dvh shrink-0"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {mobile && (
            <MobileHeader
              onOpenMenu={() => {
                setMenuOpen(true);
              }}
            />
          )}
          {/* Page layers (photos, icons, z-10 controls) stay inside this context, under the header. */}
          <main className="isolate flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
      <Toaster />
      {mobile && (
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerContent>
            <DrawerTitle className="sr-only">
              <FormattedMessage id="shellNavigationLabel" />
            </DrawerTitle>
            <Sidebar
              compact={false}
              onNavigate={closeMenu}
              onSignOut={handleSignOut}
              className="h-full w-full"
            />
          </DrawerContent>
        </Drawer>
      )}
      {tablet && (
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerContent className="w-[240px]">
            <DrawerTitle className="sr-only">
              <FormattedMessage id="shellNavigationLabel" />
            </DrawerTitle>
            <Sidebar compact={false} onNavigate={closeMenu} onSignOut={handleSignOut} className="h-full" />
          </DrawerContent>
        </Drawer>
      )}
    </TooltipProvider>
  );
}
