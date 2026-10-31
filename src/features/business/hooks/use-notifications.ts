import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  patchNotificationInCache,
  restoreNotifications,
  updateNotificationSetting,
} from '../api/business.mutations';
import { businessKeys } from '../api/business.keys';
import {
  groupNotificationSettings,
  isValidEmailReminderSendAt,
  isValidReminderMinutes,
  parseSendBeforeMinutes,
  reminderMinutesValue,
  showsReminderMinutes,
  toNotificationSettingUpdate,
  type NotificationSetting,
  visibleNotificationSettings,
} from '../model/notification-setting';

type Feedback = {
  onSaved: () => void;
  onError: (error: unknown) => void;
};

/**
 * Notifications tab: toggle and minutes with an optimistic cache update, rolled back on error.
 */
export function useNotifications(settings: NotificationSetting[], feedback: Feedback) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      isEnabled,
      sendBeforeMinutes,
      sendAtLocalTime,
    }: {
      id: string;
      isEnabled: boolean;
      sendBeforeMinutes: number | null;
      sendAtLocalTime: string | null;
    }) =>
      updateNotificationSetting(
        queryClient,
        id,
        toNotificationSettingUpdate(isEnabled, sendBeforeMinutes, sendAtLocalTime),
      ),
    onMutate: async ({ id, isEnabled, sendBeforeMinutes, sendAtLocalTime }) => {
      await queryClient.cancelQueries({ queryKey: businessKeys.notifications() });
      const previous = queryClient.getQueryData<NotificationSetting[]>(businessKeys.notifications());
      patchNotificationInCache(queryClient, id, {
        isEnabled,
        ...(sendBeforeMinutes === null ? {} : { sendBeforeMinutes }),
        ...(sendAtLocalTime === null ? {} : { sendAtLocalTime }),
      });
      return { previous };
    },
    onError: (error, _vars, context) => {
      restoreNotifications(queryClient, context?.previous);
      feedback.onError(error);
    },
    onSuccess: () => {
      feedback.onSaved();
    },
  });

  return {
    groups: groupNotificationSettings(visibleNotificationSettings(settings)),
    isSaving: (id: string) => mutation.isPending && mutation.variables.id === id,
    setEnabled: (setting: NotificationSetting, isEnabled: boolean) => {
      if (!setting.configurable) return;
      mutation.mutate({
        id: setting.id,
        isEnabled,
        // The push row requires minutes. The email row keeps its stored time when none is sent.
        sendBeforeMinutes: showsReminderMinutes(setting) ? reminderMinutesValue(setting) : null,
        sendAtLocalTime: null,
      });
    },
    setMinutes: (setting: NotificationSetting, value: string) => {
      if (!showsReminderMinutes(setting) || !isValidReminderMinutes(value)) return;
      const minutes = parseSendBeforeMinutes(value);
      if (minutes === null || minutes === setting.sendBeforeMinutes) return;
      mutation.mutate({
        id: setting.id,
        isEnabled: setting.isEnabled,
        sendBeforeMinutes: minutes,
        sendAtLocalTime: null,
      });
    },
    setSendAt: (setting: NotificationSetting, value: string) => {
      if (!setting.configurable || !isValidEmailReminderSendAt(value) || value === setting.sendAtLocalTime) {
        return;
      }
      mutation.mutate({
        id: setting.id,
        isEnabled: setting.isEnabled,
        sendBeforeMinutes: null,
        sendAtLocalTime: value,
      });
    },
  };
}
