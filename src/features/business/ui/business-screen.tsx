import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { EmptyState, Spinner } from '@/shared/ui';

import { useBusinessScreen } from '../hooks/use-business-screen';
import { useBusinessTabs } from '../hooks/use-business-tabs';
import type { BusinessTab } from '../model/business-tab';
import { BookingTab } from './booking/booking-tab';
import { GalleryTab } from './gallery/gallery-tab';
import { InfoTab } from './info/info-tab';
import { LegalTab } from './legal/legal-tab';
import { NotificationsTab } from './notifications/notifications-tab';
import { SectionSwitcher } from './section-switcher';
import { textOf } from './shared/labels';
import { WebTab } from './web/web-tab';

/** `/business` (BusinessManagementScreen): section switcher and the six configuration tabs. */
export function BusinessScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const { tab, doc, setTab, setDoc } = useBusinessTabs();
  const screen = useBusinessScreen();
  const tabState = screen.tabState(tab);

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-5 lg:p-6">
      {/* Under 768px the mobile header shows the title; wider widths keep this heading. */}
      <header className="max-[767px]:sr-only">
        <h1 className="text-title text-foreground">{text('shellHeaderBusinessTitle')}</h1>
        <p className="mt-2 text-body text-muted-foreground">{text('shellHeaderBusinessSubtitle')}</p>
      </header>
      <SectionSwitcher value={tab} onValueChange={setTab} />

      {tabState.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={36} className="text-primary" />
        </div>
      ) : tabState.error ? (
        <EmptyState
          icon="error_outline"
          title={text('businessLoadError')}
          message={describeFailure(tabState.error)}
          action={{
            label: text('adminCommonRetry'),
            icon: 'refresh',
            onClick: tabState.retry,
          }}
        />
      ) : (
        <TabBody tab={tab} doc={doc} setDoc={setDoc} screen={screen} />
      )}
    </div>
  );
}

function TabBody({
  tab,
  doc,
  setDoc,
  screen,
}: {
  tab: BusinessTab;
  doc: string | undefined;
  setDoc: (code: string) => void;
  screen: ReturnType<typeof useBusinessScreen>;
}) {
  const intl = useIntl();
  const text = textOf(intl);

  switch (tab) {
    case 'info':
      return screen.info ? (
        <InfoTab info={screen.info} />
      ) : (
        <EmptyState
          icon="storefront_outlined"
          title={text('businessInfoEmpty')}
          message={text('businessInfoGeneralDataSubtitle')}
        />
      );
    case 'booking':
      return screen.booking ? (
        <BookingTab settings={screen.booking} />
      ) : (
        <EmptyState
          icon="event_available_outlined"
          title={text('businessBookingSettingsEmpty')}
          message={text('businessBookingSettingsSubtitle')}
        />
      );
    case 'notifications':
      return <NotificationsTab settings={screen.notifications} />;
    case 'legal':
      return <LegalTab documents={screen.legal} selectedCode={doc} onSelectCode={setDoc} />;
    case 'web':
      return <WebTab pages={screen.web} selectedCode={doc} onSelectCode={setDoc} />;
    case 'gallery':
      return <GalleryTab slides={screen.gallery} />;
  }
}
