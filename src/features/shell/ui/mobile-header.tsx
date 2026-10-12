import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Button, Icon } from '@/shared/ui';

import { useShellHeader } from '../hooks/use-shell-route';

/**
 * `_MobileShellHeader` (under 700px): menu button and brand, then the screen's breadcrumbs, title,
 * and subtitle. A route without a header (the 404) shows the first row only.
 */
export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const intl = useIntl();
  const header = useShellHeader();
  const breadcrumbs = header?.breadcrumbs ?? [];

  return (
    // Scaffold background, outlineVariant bottom border, shadow at 6% with a 16px blur 4px down.
    <header
      role="banner"
      className="sticky top-0 z-10 border-b border-outline-variant bg-background px-3 pt-3 pb-3.5 shadow-[0_4px_16px_rgb(0_0_0/0.06)]"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          aria-label={intl.formatMessage({ id: 'shellOpenMenu' })}
          onClick={onOpenMenu}
          className="size-11 rounded-[14px] bg-on-surface/4 text-on-surface"
        >
          <Icon name="menu_rounded" size={26} />
        </Button>
        <span className="min-w-0 flex-1 truncate text-[18px] font-black text-content-muted">
          <FormattedMessage id="shellMobileBrand" />
        </span>
      </div>
      {header && (
        <div className="mt-3.5">
          {breadcrumbs.length > 0 && (
            <ol className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px]">
              {breadcrumbs.map((crumb, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li
                    key={crumb}
                    className={cn(
                      'flex items-center gap-1.5',
                      last ? 'font-extrabold text-on-surface' : 'font-semibold text-content-muted',
                    )}
                  >
                    <FormattedMessage id={crumb} />
                    {!last && <Icon name="chevron_right_rounded" size={16} className="text-content-muted" />}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="text-[22px] leading-[1.1] font-black text-on-surface">
            <FormattedMessage id={header.title} />
          </p>
          <p className="mt-2 text-body-md leading-[1.5] text-content-muted">
            <FormattedMessage id={header.subtitle} />
          </p>
        </div>
      )}
    </header>
  );
}
