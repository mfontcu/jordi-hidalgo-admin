import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Icon, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';

import { useActiveSection } from '../hooks/use-shell-route';
import { SIDEBAR_SECTIONS } from '../model/sections';
import { SidebarFooter } from './sidebar-footer';
import { SidebarIconButton } from './sidebar-icon-button';

type SidebarProps = {
  /** The 60px icon rail. Section names are exposed only as the accessible name. */
  compact: boolean;
  /** Desktop: collapse or expand, and persist `hj_admin.sidebar_collapsed`. */
  onToggleCollapse?: () => void;
  /** Tablet rail: open the labeled sidebar as an overlay. Does not write the collapse preference. */
  onOpenOverlay?: () => void;
  /** Called when a section is chosen, before the navigation (the drawer or overlay closes). */
  onNavigate?: () => void;
  onSignOut: () => void;
  className?: string;
};

/** Dark in both modes, 240px wide, or a 60px rail when compact. */
export function Sidebar({
  compact,
  onToggleCollapse,
  onOpenOverlay,
  onNavigate,
  onSignOut,
  className,
}: SidebarProps) {
  const intl = useIntl();
  const active = useActiveSection();

  return (
    <div
      className={cn(
        'flex flex-col bg-sidebar transition-[width] duration-150 ease-out',
        compact ? 'w-[60px]' : 'w-[240px]',
        className,
      )}
    >
      {!compact ? (
        <div className="flex items-center gap-1 p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-heading text-sidebar-foreground">
              <FormattedMessage id="adminBrandName" />
            </span>
            <span className="text-caption text-sidebar-muted">
              <FormattedMessage id="adminBrandSubtitle" />
            </span>
          </div>
          {onToggleCollapse && (
            <SidebarIconButton
              icon="keyboard_double_arrow_left_rounded"
              label={intl.formatMessage({ id: 'adminNavCollapseMenu' })}
              onClick={onToggleCollapse}
            />
          )}
        </div>
      ) : onOpenOverlay ? (
        <div className="flex justify-center px-2 py-3.5">
          <SidebarIconButton
            icon="menu_rounded"
            label={intl.formatMessage({ id: 'shellOpenMenu' })}
            onClick={onOpenOverlay}
          />
        </div>
      ) : (
        onToggleCollapse && (
          <div className="flex justify-center px-2 py-3.5">
            <SidebarIconButton
              icon="keyboard_double_arrow_right_rounded"
              label={intl.formatMessage({ id: 'adminNavExpandMenu' })}
              onClick={onToggleCollapse}
            />
          </div>
        )
      )}
      <div className="h-px shrink-0 bg-white/8" />
      <nav
        aria-label={intl.formatMessage({ id: 'shellNavigationLabel' })}
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto',
          compact ? 'gap-1.5 p-2' : 'gap-2.5 p-3',
        )}
      >
        {SIDEBAR_SECTIONS.map((section) => {
          const selected = section.path === active;
          const label = intl.formatMessage({ id: section.label });
          const link = (
            <Link
              to={section.path}
              onClick={onNavigate}
              aria-label={compact ? label : undefined}
              aria-current={selected ? 'page' : undefined}
              // The highlight comes from `selected` (?sidebar= or the path prefix), not from the URL.
              activeOptions={{ exact: true, includeSearch: false }}
              className={cn(
                'relative flex shrink-0 items-center rounded-md hover:bg-sidebar-hover',
                compact ? 'justify-center p-2' : 'gap-3 px-3.5 py-3',
              )}
            >
              {selected && (
                <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 bg-sidebar-active" />
              )}
              <Icon
                name={section.icon}
                size={20}
                className={selected ? 'text-sidebar-foreground' : 'text-sidebar-muted'}
              />
              {!compact && (
                <span
                  className={cn(
                    'min-w-0 flex-1',
                    selected ? 'text-body-strong text-sidebar-foreground' : 'text-sidebar-muted',
                  )}
                >
                  {label}
                </span>
              )}
            </Link>
          );
          return compact ? (
            <Tooltip key={section.path}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ) : (
            <Fragment key={section.path}>{link}</Fragment>
          );
        })}
      </nav>
      <div className="h-px shrink-0 bg-white/8" />
      <SidebarFooter compact={compact} onSignOut={onSignOut} />
    </div>
  );
}
