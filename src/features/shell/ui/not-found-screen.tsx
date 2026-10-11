import { Link } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';

import { Button, Icon } from '@/shared/ui';

/** A signed-in path that matches no screen: shown inside the shell, with a way back to the dashboard. */
export function NotFoundScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon name="error_outline" size={48} className="text-content-muted" />
      <h1 className="text-title-lg text-on-surface">
        <FormattedMessage id="shellNotFoundTitle" />
      </h1>
      <p className="max-w-md text-body-lg">
        <FormattedMessage id="shellNotFoundMessage" />
      </p>
      <Button asChild variant="secondary" className="mt-3">
        <Link to="/">
          <FormattedMessage id="shellNotFoundAction" />
        </Link>
      </Button>
    </div>
  );
}
