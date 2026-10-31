import {
  emailReminderSendTimes,
  groupNotificationSettings,
  isReminderType,
  isValidEmailReminderSendAt,
  isValidReminderMinutes,
  parseSendBeforeMinutes,
  showsReminderMinutes,
  showsReminderSendTime,
  toNotificationSettingUpdate,
  type NotificationSetting,
  visibleNotificationSettings,
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
  sendAtLocalTime: null,
  configurable: true,
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
    expect(toNotificationSettingUpdate(true, null, '09:30')).toEqual({
      isEnabled: true,
      sendAtLocalTime: '09:30',
    });
  });

  it.each([
    ['5', true],
    ['60', true],
    ['1440', true],
    ['4', false],
    ['1441', false],
    ['0', false],
    ['-1', false],
    ['', false],
    ['texto', false],
  ])('accepts reminder minutes %j only inside 5 to 1440', (value, valid) => {
    expect(isValidReminderMinutes(value)).toBe(valid);
  });

  it('lists the email send times from 07:00 to 21:00 every 15 minutes', () => {
    const times = emailReminderSendTimes();
    expect(times[0]).toBe('07:00');
    expect(times.at(-1)).toBe('21:00');
    expect(times).toContain('08:00');
    expect(times).toContain('09:45');
    expect(times).toHaveLength(57);
    expect(isValidEmailReminderSendAt('08:00')).toBe(true);
    expect(isValidEmailReminderSendAt('06:45')).toBe(false);
    expect(isValidEmailReminderSendAt('21:15')).toBe(false);
    expect(isValidEmailReminderSendAt('08:07')).toBe(false);
    expect(isValidEmailReminderSendAt('8:00')).toBe(false);
  });

  it('shows minutes on the reminder push and a send time on the reminder email', () => {
    expect(showsReminderMinutes(setting())).toBe(true);
    expect(showsReminderSendTime(setting())).toBe(false);
    const email = setting({ notificationChannelCode: 'email', sendAtLocalTime: '08:00' });
    expect(showsReminderMinutes(email)).toBe(false);
    expect(showsReminderSendTime(email)).toBe(true);
    expect(showsReminderMinutes(setting({ configurable: false }))).toBe(false);
    expect(showsReminderSendTime(setting({ notificationChannelCode: 'email', configurable: false }))).toBe(
      false,
    );
  });

  it('keeps only the rows staff can edit, in their order', () => {
    const email = setting({ id: 'email', notificationChannelCode: 'email' });
    const change = setting({ id: 'change', notificationTypeCode: 'appointment_change', configurable: false });
    const push = setting({ id: 'push' });
    expect(visibleNotificationSettings([email, change, push]).map((row) => row.id)).toEqual([
      'email',
      'push',
    ]);
    expect(visibleNotificationSettings([change])).toEqual([]);
  });
});
