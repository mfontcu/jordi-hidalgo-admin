import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { EmptyState, InfoCard, Input, showErrorToast, showToast, Switch } from '@/shared/ui';

import { useNotifications } from '../../hooks/use-notifications';
import type { NotificationSetting } from '../../model/notification-setting';
import { textOf } from '../shared/labels';

type NotificationsTabProps = { settings: NotificationSetting[] };

/** Notification type groups with per-channel toggles and optional reminder minutes. */
export function NotificationsTab({ settings }: NotificationsTabProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const notifications = useNotifications(settings, {
    onSaved: () => {
      showToast(text('businessNotificationSettingSaved'));
    },
    onError: (error) => {
      showErrorToast(describeFailure(error, 'businessNotificationSettingSaveError'));
    },
  });

  if (settings.length === 0) {
    return (
      <EmptyState
        icon="notifications_none_outlined"
        title={text('businessNotificationsEmptyTitle')}
        message={text('businessNotificationsEmptySubtitle')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body-md text-content-secondary">{text('businessNotificationsIntro')}</p>
      {notifications.groups.map((group) => (
        <InfoCard key={group.typeCode} title={group.typeName} icon="notifications_none_outlined">
          {group.typeDescription ? (
            <p className="mb-4 text-body-md text-content-secondary">{group.typeDescription}</p>
          ) : null}
          <div className="flex flex-col gap-3">
            {group.channels.map((channel) => (
              <NotificationChannelRow
                key={channel.id}
                setting={channel}
                showMinutes={notifications.isReminderType(channel)}
                saving={notifications.isSaving(channel.id)}
                onToggle={(enabled) => {
                  notifications.setEnabled(channel, enabled);
                }}
                onMinutes={(value) => {
                  notifications.setMinutes(channel, value);
                }}
                minutesLabel={text('businessNotificationsMinutesBefore')}
              />
            ))}
          </div>
        </InfoCard>
      ))}
    </div>
  );
}

function NotificationChannelRow({
  setting,
  showMinutes,
  saving,
  onToggle,
  onMinutes,
  minutesLabel,
}: {
  setting: NotificationSetting;
  showMinutes: boolean;
  saving: boolean;
  onToggle: (enabled: boolean) => void;
  onMinutes: (value: string) => void;
  minutesLabel: string;
}) {
  const [minutes, setMinutes] = useState(
    setting.sendBeforeMinutes === null ? '' : String(setting.sendBeforeMinutes),
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-on-surface">{setting.notificationChannelName}</p>
        <p className="text-body-sm text-content-muted">{setting.notificationChannelCode}</p>
      </div>
      {showMinutes && (
        <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span>{minutesLabel}</span>
          <Input
            className="w-20"
            inputMode="numeric"
            value={minutes}
            disabled={saving}
            onChange={(event) => {
              setMinutes(event.target.value);
            }}
            onBlur={() => {
              onMinutes(minutes);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onMinutes(minutes);
            }}
          />
        </label>
      )}
      <Switch
        checked={setting.isEnabled}
        disabled={saving}
        onCheckedChange={onToggle}
        aria-label={setting.notificationChannelName}
      />
    </div>
  );
}
