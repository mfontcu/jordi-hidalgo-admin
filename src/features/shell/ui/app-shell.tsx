import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { signOut } from '@/features/auth';
import { Drawer, DrawerContent, DrawerTitle, Toaster, TooltipProvider } from '@/shared/ui';

import { useSidebarStore } from '../hooks/sidebar-store';
import { useShellLayout } from '../hooks/use-shell-layout';
import { MobileHeader } from './mobile-header';
import { Sidebar } from './sidebar';

/**
 * Signed-in layout (admin_shell.dart AdminPageShell): under 700px a drawer and the mobile header;
 * 700–1099px the compact sidebar; from 1100px the full sidebar, which staff can collapse. The
 * content keeps its place in the tree across layouts, so resizing never resets a screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const layout = useShellLayout();
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Sign-out from the sidebar (AdminAppServices.logout): back to the login screen, no notice.
  const handleSignOut = () => {
    setDrawerOpen(false);
    signOut(queryClient);
    void navigate({ to: '/login', replace: true });
  };

  const mobile = layout === 'mobile';

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh bg-background">
        {!mobile && (
          <Sidebar
            compact={layout === 'tablet' || collapsed}
            onToggleCollapse={layout === 'desktop' ? toggleCollapsed : undefined}
            onSignOut={handleSignOut}
            className="sticky top-0 h-dvh shrink-0"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {mobile && (
            <MobileHeader
              onOpenMenu={() => {
                setDrawerOpen(true);
              }}
            />
          )}
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
      {/* The signed-in screens' toaster (the shell's ScaffoldMessenger in Flutter). */}
      <Toaster />
      {mobile && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerTitle className="sr-only">
              <FormattedMessage id="shellNavigationLabel" />
            </DrawerTitle>
            <Sidebar
              compact={false}
              onNavigate={() => {
                setDrawerOpen(false);
              }}
              onSignOut={handleSignOut}
              className="h-full w-full"
            />
          </DrawerContent>
        </Drawer>
      )}
    </TooltipProvider>
  );
}
