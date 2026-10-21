import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useLocaleStore, type Locale } from '@/shared/i18n';
import type { DateLocale } from '@/shared/lib/business-time';
import { showToast } from '@/shared/ui';

import { openActivityDestination } from '../hooks/open-activity';
import { useActivityStream } from '../hooks/use-activity-stream';
import { useServiceName } from '../hooks/use-service-name';
import { destination } from '../model/destination';
import { activityMoment, activityNotice } from '../model/notice';
import type { ActivityItem } from '../model/refresh';
import { ActivitySentence } from './activity-sentence';

/**
 * Opens the activity stream once the shell is on screen. The session guard has already restored
 * the tokens, so this is the single connection for the tab.
 */
export function ActivityLive() {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const navigate = useNavigate();
  const serviceName = useServiceName();

  const onToast = useCallback(
    (item: ActivityItem) => {
      const name = serviceName(item.payload.serviceId);
      if (!activityNotice(item.kind, item.payload, name, activityMoment(item.payload, dateLocale(locale)))) {
        return;
      }
      const target = destination(item.kind, item.payload);
      showToast(
        <ActivitySentence item={item} serviceName={name} />,
        target
          ? {
              action: {
                label: intl.formatMessage({ id: 'activityOpen' }),
                onClick: () => {
                  openActivityDestination(navigate, target);
                },
              },
            }
          : undefined,
      );
    },
    [intl, locale, navigate, serviceName],
  );

  useActivityStream(onToast);
  return null;
}

function dateLocale(locale: Locale): DateLocale {
  return locale;
}
