import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  patchNotificationInCache,
  restoreNotifications,
  updateNotificationSetting,
} from '../api/business.mutations';
import { businessKeys } from '../api/business.keys';
import {
  groupNotificationSettings,
  isReminderType,
  parseSendBeforeMinutes,
  toNotificationSettingUpdate,
  type NotificationSetting,
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
    }: {
      id: string;
      isEnabled: boolean;
      sendBeforeMinutes: number | null;
    }) =>
      updateNotificationSetting(queryClient, id, toNotificationSettingUpdate(isEnabled, sendBeforeMinutes)),
    onMutate: async ({ id, isEnabled, sendBeforeMinutes }) => {
      await queryClient.cancelQueries({ queryKey: businessKeys.notifications() });
      const previous = queryClient.getQueryData<NotificationSetting[]>(businessKeys.notifications());
      patchNotificationInCache(queryClient, id, { isEnabled, sendBeforeMinutes });
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
    groups: groupNotificationSettings(settings),
    isReminderType,
    isSaving: (id: string) => mutation.isPending && mutation.variables.id === id,
    setEnabled: (setting: NotificationSetting, isEnabled: boolean) => {
      mutation.mutate({
        id: setting.id,
        isEnabled,
        sendBeforeMinutes: setting.sendBeforeMinutes,
      });
    },
    setMinutes: (setting: NotificationSetting, value: string) => {
      const minutes = parseSendBeforeMinutes(value);
      if (minutes === null && value.trim() !== '') return;
      mutation.mutate({
        id: setting.id,
        isEnabled: setting.isEnabled,
        sendBeforeMinutes: minutes,
      });
    },
  };
}
