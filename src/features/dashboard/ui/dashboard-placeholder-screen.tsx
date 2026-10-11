import { FormattedMessage } from 'react-intl';

/** Placeholder home until phase 11 builds the dashboard. */
export function DashboardPlaceholderScreen() {
  return (
    <main>
      <h1>
        <FormattedMessage id="adminBrandName" />
      </h1>
      <p>
        <FormattedMessage id="adminBrandSubtitle" />
      </p>
    </main>
  );
}
