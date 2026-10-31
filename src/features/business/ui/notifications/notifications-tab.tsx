import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import {
  EmptyState,
  FieldError,
  InfoCard,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  showErrorToast,
  showToast,
  Switch,
} from '@/shared/ui';

import { useNotifications } from '../../hooks/use-notifications';
import {
  emailReminderSendTimes,
  emailSendAtValue,
  isValidReminderMinutes,
  reminderMinutesValue,
  showsReminderMinutes,
  showsReminderSendTime,
  type NotificationSetting,
} from '../../model/notification-setting';
import { textOf } from '../shared/labels';
import {
  notificationChannelLabel,
  notificationTypeDescription,
  notificationTypeTitle,
} from './notification-labels';

type NotificationsTabProps = { settings: NotificationSetting[] };

/** The notification rows staff can edit: the two reminders. */
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

  if (notifications.groups.length === 0) {
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
      <p className="text-body text-muted-foreground">{text('businessNotificationsIntro')}</p>
      {notifications.groups.map((group) => {
        const description = notificationTypeDescription(text, group.typeCode, group.typeDescription);
        return (
          <InfoCard
            key={group.typeCode}
            title={notificationTypeTitle(text, group.typeCode, group.typeName)}
            icon="notifications_none_outlined"
          >
            {description ? <p className="mb-4 text-body text-muted-foreground">{description}</p> : null}
            <div className="flex flex-col gap-3">
              {group.channels.map((channel) => (
                <NotificationChannelRow
                  key={`${channel.id}:${reminderMinutesValue(channel)}`}
                  setting={channel}
                  saving={notifications.isSaving(channel.id)}
                  onToggle={(enabled) => {
                    notifications.setEnabled(channel, enabled);
                  }}
                  onMinutes={(value) => {
                    notifications.setMinutes(channel, value);
                  }}
                  onSendAt={(value) => {
                    notifications.setSendAt(channel, value);
                  }}
                  text={text}
                />
              ))}
            </div>
          </InfoCard>
        );
      })}
    </div>
  );
}

function NotificationChannelRow({
  setting,
  saving,
  onToggle,
  onMinutes,
  onSendAt,
  text,
}: {
  setting: NotificationSetting;
  saving: boolean;
  onToggle: (enabled: boolean) => void;
  onMinutes: (value: string) => void;
  onSendAt: (value: string) => void;
  text: (id: MessageId) => string;
}) {
  const channelName = notificationChannelLabel(
    text,
    setting.notificationChannelCode,
    setting.notificationChannelName,
  );
  const showMinutes = showsReminderMinutes(setting);
  const showTime = showsReminderSendTime(setting);
  const storedMinutes = String(reminderMinutesValue(setting));
  const [minutes, setMinutes] = useState(storedMinutes);
  const [minutesError, setMinutesError] = useState(false);

  function commitMinutes() {
    if (minutes.trim() === storedMinutes) {
      setMinutes(storedMinutes);
      setMinutesError(false);
      return;
    }
    if (!isValidReminderMinutes(minutes)) {
      setMinutes(storedMinutes);
      setMinutesError(true);
      return;
    }
    setMinutesError(false);
    onMinutes(minutes);
  }

  const note = showTime ? text('businessNotificationsEmailNote') : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-strong text-foreground">{channelName}</p>
        <div className="flex flex-wrap items-center gap-3">
          {showMinutes ? (
            <label className="flex items-center gap-2 text-caption text-foreground">
              <span>{text('businessNotificationsMinutesBefore')}</span>
              <Input
                className="w-20"
                inputMode="numeric"
                value={minutes}
                disabled={saving}
                aria-invalid={minutesError}
                onChange={(event) => {
                  setMinutes(event.target.value);
                  setMinutesError(false);
                }}
                onBlur={commitMinutes}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitMinutes();
                }}
              />
            </label>
          ) : null}
          {showTime ? (
            <Select value={emailSendAtValue(setting)} disabled={saving} onValueChange={onSendAt}>
              <SelectTrigger className="w-28" aria-label={text('businessNotificationsSendAt')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emailReminderSendTimes().map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Switch
            checked={setting.isEnabled}
            disabled={saving}
            onCheckedChange={onToggle}
            aria-label={channelName}
          />
        </div>
      </div>
      {showMinutes ? (
        <p className="text-caption text-muted-foreground">{text('businessNotificationsMinutesHelp')}</p>
      ) : null}
      {minutesError ? (
        <FieldError className="px-0">{text('businessNotificationsMinutesInvalid')}</FieldError>
      ) : null}
      {note ? <p className="text-caption text-muted-foreground">{note}</p> : null}
    </div>
  );
}
