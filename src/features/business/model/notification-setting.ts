export type NotificationSetting = {
  id: string;
  notificationTypeId: string;
  notificationTypeCode: string;
  notificationTypeName: string;
  notificationTypeDescription: string;
  notificationChannelId: string;
  notificationChannelCode: string;
  notificationChannelName: string;
  isEnabled: boolean;
  sendBeforeMinutes: number | null;
};

export type NotificationSettingUpdate = {
  isEnabled: boolean;
  sendBeforeMinutes?: number;
};

/** Flutter shows a minutes field when the type code contains `reminder`. */
export function isReminderType(setting: NotificationSetting): boolean {
  return setting.notificationTypeCode.toLowerCase().includes('reminder');
}

/** Group by type code, preserving list order of first appearance. */
export function groupNotificationSettings(
  settings: NotificationSetting[],
): { typeCode: string; typeName: string; typeDescription: string; channels: NotificationSetting[] }[] {
  const groups: {
    typeCode: string;
    typeName: string;
    typeDescription: string;
    channels: NotificationSetting[];
  }[] = [];
  const indexByCode = new Map<string, number>();
  for (const setting of settings) {
    const existing = indexByCode.get(setting.notificationTypeCode);
    if (existing === undefined) {
      indexByCode.set(setting.notificationTypeCode, groups.length);
      groups.push({
        typeCode: setting.notificationTypeCode,
        typeName: setting.notificationTypeName,
        typeDescription: setting.notificationTypeDescription,
        channels: [setting],
      });
    } else {
      groups[existing]?.channels.push(setting);
    }
  }
  return groups;
}

/** Empty or invalid minutes become omitted (Flutter stores null). */
export function parseSendBeforeMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[+-]?\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function toNotificationSettingUpdate(
  isEnabled: boolean,
  sendBeforeMinutes: number | null,
): NotificationSettingUpdate {
  return {
    isEnabled,
    ...(sendBeforeMinutes === null ? {} : { sendBeforeMinutes }),
  };
}
