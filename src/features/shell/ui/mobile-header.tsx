import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Button, Icon } from '@/shared/ui';

import { useShellHeader } from '../hooks/use-shell-route';

/**
 * Mobile header (under 768px): menu button and brand, then the screen's breadcrumbs, title,
 * and subtitle. A route without a header (the 404) shows the first row only.
 */
export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const intl = useIntl();
  const header = useShellHeader();
  const breadcrumbs = header?.breadcrumbs ?? [];

  return (
    <header role="banner" className="sticky top-0 z-10 border-b border-border bg-background px-3 pt-3 pb-3.5">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          aria-label={intl.formatMessage({ id: 'shellOpenMenu' })}
          onClick={onOpenMenu}
          className="size-11 rounded-md bg-foreground/4 text-foreground"
        >
          <Icon name="menu_rounded" size={20} />
        </Button>
        <span className="min-w-0 flex-1 truncate text-heading text-muted-foreground">
          <FormattedMessage id="shellMobileBrand" />
        </span>
      </div>
      {header && (
        <div className="mt-3.5">
          {breadcrumbs.length > 0 && (
            <ol className="mb-2 flex flex-wrap items-center gap-1.5 text-caption">
              {breadcrumbs.map((crumb, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li
                    key={crumb}
                    className={cn(
                      'flex items-center gap-1.5',
                      last ? 'text-body-strong text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <FormattedMessage id={crumb} />
                    {!last && (
                      <Icon name="chevron_right_rounded" size={16} className="text-muted-foreground" />
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="text-title text-foreground">
            <FormattedMessage id={header.title} />
          </p>
          <p className="mt-2 text-body text-muted-foreground">
            <FormattedMessage id={header.subtitle} />
          </p>
        </div>
      )}
    </header>
  );
}
