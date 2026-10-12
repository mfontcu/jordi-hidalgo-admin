import {
  groupNotificationSettings,
  isReminderType,
  parseSendBeforeMinutes,
  toNotificationSettingUpdate,
  type NotificationSetting,
} from './notification-setting';

const setting = (overrides: Partial<NotificationSetting> = {}): NotificationSetting => ({
  id: 'n-1',
  notificationTypeId: 't-1',
  notificationTypeCode: 'appointment_reminder',
  notificationTypeName: 'Recordatorio',
  notificationTypeDescription: 'Antes de la cita',
  notificationChannelId: 'c-1',
  notificationChannelCode: 'push',
  notificationChannelName: 'Push',
  isEnabled: true,
  sendBeforeMinutes: 60,
  ...overrides,
});

describe('notification setting', () => {
  it('treats type codes that contain reminder as minute-backed', () => {
    expect(isReminderType(setting())).toBe(true);
    expect(isReminderType(setting({ notificationTypeCode: 'appointment_confirmed' }))).toBe(false);
  });

  it('groups by type code preserving first-seen order', () => {
    const groups = groupNotificationSettings([
      setting({ id: '1', notificationTypeCode: 'a', notificationTypeName: 'A' }),
      setting({
        id: '2',
        notificationTypeCode: 'b',
        notificationTypeName: 'B',
        notificationChannelCode: 'email',
      }),
      setting({ id: '3', notificationTypeCode: 'a', notificationChannelCode: 'email' }),
    ]);
    expect(groups.map((group) => group.typeCode)).toEqual(['a', 'b']);
    expect(groups[0]?.channels).toHaveLength(2);
  });

  it('parses non-negative integer minutes and omits them when empty', () => {
    expect(parseSendBeforeMinutes('30')).toBe(30);
    expect(parseSendBeforeMinutes('')).toBeNull();
    expect(parseSendBeforeMinutes('-1')).toBeNull();
    expect(parseSendBeforeMinutes('1.5')).toBeNull();
    expect(toNotificationSettingUpdate(true, null)).toEqual({ isEnabled: true });
    expect(toNotificationSettingUpdate(false, 15)).toEqual({ isEnabled: false, sendBeforeMinutes: 15 });
  });
});
