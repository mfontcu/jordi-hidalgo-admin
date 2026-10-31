/** Inclusive bounds of the reminder push, matching the backend. */
export const REMINDER_MINUTES_MIN = 5;
export const REMINDER_MINUTES_MAX = 1440;
export const REMINDER_MINUTES_DEFAULT = 60;

/** Salon-local time the reminder email uses when none is stored. */
export const EMAIL_REMINDER_SEND_AT_DEFAULT = '08:00';

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
  /** HH:MM on the reminder email row; null on the others. */
  sendAtLocalTime: string | null;
  /** False when the notice is sent but this row does not drive it. */
  configurable: boolean;
};

export type NotificationSettingUpdate = {
  isEnabled: boolean;
  sendBeforeMinutes?: number;
  sendAtLocalTime?: string;
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

/** True when the text is an integer from 5 to 1440. */
export function isValidReminderMinutes(value: string): boolean {
  const parsed = parseSendBeforeMinutes(value);
  return parsed !== null && parsed >= REMINDER_MINUTES_MIN && parsed <= REMINDER_MINUTES_MAX;
}

/** 07:00 through 21:00, every quarter of an hour. */
export function emailReminderSendTimes(): string[] {
  const times: string[] = [];
  for (let minutes = 7 * 60; minutes <= 21 * 60; minutes += 15) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  return times;
}

export function isValidEmailReminderSendAt(value: string): boolean {
  return emailReminderSendTimes().includes(value);
}

/** Minutes field: only the editable reminder push. */
export function showsReminderMinutes(setting: NotificationSetting): boolean {
  return setting.configurable && isReminderType(setting) && setting.notificationChannelCode === 'push';
}

/** Send-time field: only the editable reminder email. */
export function showsReminderSendTime(setting: NotificationSetting): boolean {
  return setting.configurable && isReminderType(setting) && setting.notificationChannelCode === 'email';
}

/**
 * The rows staff can edit. The backend also lists notices it always sends (configurable
 * false); the panel does not show them.
 */
export function visibleNotificationSettings(settings: NotificationSetting[]): NotificationSetting[] {
  return settings.filter((setting) => setting.configurable);
}

/** Minutes shown and saved for the reminder push. A missing or out-of-range value is 60. */
export function reminderMinutesValue(setting: NotificationSetting): number {
  const minutes = setting.sendBeforeMinutes;
  if (minutes !== null && minutes >= REMINDER_MINUTES_MIN && minutes <= REMINDER_MINUTES_MAX) return minutes;
  return REMINDER_MINUTES_DEFAULT;
}

/** Send time shown for the reminder email. A missing or unreadable value is 08:00. */
export function emailSendAtValue(setting: NotificationSetting): string {
  if (setting.sendAtLocalTime && isValidEmailReminderSendAt(setting.sendAtLocalTime)) {
    return setting.sendAtLocalTime;
  }
  return EMAIL_REMINDER_SEND_AT_DEFAULT;
}

export function toNotificationSettingUpdate(
  isEnabled: boolean,
  sendBeforeMinutes: number | null,
  sendAtLocalTime?: string | null,
): NotificationSettingUpdate {
  return {
    isEnabled,
    ...(sendBeforeMinutes === null ? {} : { sendBeforeMinutes }),
    ...(sendAtLocalTime ? { sendAtLocalTime } : {}),
  };
}
