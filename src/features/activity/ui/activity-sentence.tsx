import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import { useLocaleStore, type Locale } from '@/shared/i18n';
import type { DateLocale } from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui';

import { activityMoment, activityNotice, type ActivityMoment, type ActivityNotice } from '../model/notice';
import type { ActivityItem } from '../model/refresh';
import { messageOf } from './activity-text';

const PRESENTATION: Record<ActivityNotice['template'], { icon: IconName; tone: string }> = {
  booked: { icon: 'event_available_outlined', tone: 'text-success' },
  rescheduled: { icon: 'edit_calendar_outlined', tone: 'text-warning' },
  cancelled: { icon: 'event_busy_outlined', tone: 'text-destructive' },
  slotWatchCreated: { icon: 'notifications_active_outlined', tone: 'text-warning' },
  slotWatchCancelled: { icon: 'notifications_off_outlined', tone: 'text-destructive' },
  slotWatchHoldReleased: { icon: 'lock_open_outlined', tone: 'text-warning' },
  clientRegistered: { icon: 'person_add_outlined', tone: 'text-success' },
  clientAccountDeleted: { icon: 'person_off_outlined', tone: 'text-destructive' },
};

type ActivitySentenceProps = {
  item: ActivityItem;
  serviceName: string | null;
};

/** Icon plus the sentence, with the kind's word in bold and in its color. */
export function ActivitySentence({ item, serviceName }: ActivitySentenceProps) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const moment = activityMoment(item.payload, dateLocale(locale));
  const notice = activityNotice(item.kind, item.payload, serviceName, moment);
  if (!notice) return null;

  const { icon, tone } = PRESENTATION[notice.template];
  const name = notice.name || intl.formatMessage({ id: 'activityUnknownName' });
  const message = messageOf(notice, name, whenOf(intl, moment));

  return (
    <span className="flex items-start gap-2">
      <Icon name={icon} size={18} className={cn('mt-0.5', tone)} />
      <span className="min-w-0 flex-1">
        <FormattedMessage
          id={message.id}
          values={{
            ...message.values,
            b: (chunks) => <span className={cn('text-body-strong', tone)}>{chunks}</span>,
          }}
        />
      </span>
    </span>
  );
}

function whenOf(intl: IntlShape, moment: ActivityMoment): string {
  const { time } = moment;
  switch (moment.day) {
    case 'today':
      return intl.formatMessage({ id: 'activityWhenToday' }, { time });
    case 'tomorrow':
      return intl.formatMessage({ id: 'activityWhenTomorrow' }, { time });
    case 'date':
      return intl.formatMessage({ id: 'activityWhenDate' }, { date: moment.date, time });
    case 'unknown':
      return intl.formatMessage({ id: 'activityWhenTime' }, { time });
  }
}

function dateLocale(locale: Locale): DateLocale {
  return locale;
}
