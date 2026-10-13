import { FormattedMessage } from 'react-intl';

import { useShellHeader } from '../hooks/use-shell-route';

/**
 * Empty screen of a route whose feature is not built yet: its header's title and subtitle. Under
 * 768px the mobile header already shows them, so the title stays for assistive technology only.
 */
export function RoutePlaceholderScreen() {
  const header = useShellHeader();
  if (!header) return null;
  return (
    <div className="flex flex-col gap-2 p-6">
      <h1 className="text-title text-foreground max-[767px]:sr-only">
        <FormattedMessage id={header.title} />
      </h1>
      <p className="text-body max-[767px]:hidden">
        <FormattedMessage id={header.subtitle} />
      </p>
    </div>
  );
}
