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
  /** The 60px icon-only sidebar. */
  compact: boolean;
  /** Collapse or expand (only from 1100px; the 700–1099px compact sidebar cannot expand). */
  onToggleCollapse?: () => void;
  /** Called when a section is chosen, before the navigation (the drawer closes). */
  onNavigate?: () => void;
  onSignOut: () => void;
  className?: string;
};

/** admin_sidebar.dart: dark in both modes, 240px wide, or 60px when compact. */
export function Sidebar({ compact, onToggleCollapse, onNavigate, onSignOut, className }: SidebarProps) {
  const intl = useIntl();
  const active = useActiveSection();

  return (
    <div
      className={cn(
        'flex flex-col bg-sidebar-background transition-[width] duration-180 ease-out',
        compact ? 'w-[60px]' : 'w-[240px]',
        className,
      )}
    >
      {!compact ? (
        <div className="flex items-center p-[18px]">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[20px] font-black text-sidebar-foreground">
              <FormattedMessage id="adminBrandName" />
            </span>
            <span className="text-[12px] text-sidebar-foreground-muted">
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
                'flex shrink-0 items-center rounded-lg hover:bg-black/4 dark:hover:bg-white/4',
                compact ? 'p-2' : 'px-3.5 py-3',
                selected &&
                  'border border-sidebar-accent-border bg-linear-to-r from-brand-blue/18 to-brand-blue/8',
              )}
            >
              {selected && !compact && (
                <span className="mr-2.5 h-7 w-[3px] rounded-pill bg-sidebar-accent-fg" />
              )}
              <span
                className={cn(
                  'flex items-center justify-center rounded-[10px]',
                  compact ? 'size-7' : 'size-8',
                  selected
                    ? 'bg-sidebar-accent-bg text-sidebar-accent-fg'
                    : 'bg-white/4 text-sidebar-foreground-muted',
                )}
              >
                <Icon name={section.icon} size={compact ? 18 : 19} />
              </span>
              {!compact && (
                <span
                  className={cn(
                    'ml-3 min-w-0 flex-1',
                    selected
                      ? 'font-extrabold text-sidebar-foreground'
                      : 'font-semibold text-sidebar-foreground-muted',
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
