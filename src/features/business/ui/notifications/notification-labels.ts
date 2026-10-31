import type { MessageId } from '@/shared/i18n';

// The backend stores one English name per notification type and channel, so the panel
// labels the codes it shows in its own language and keeps the stored name for any other.

const TYPE_LABELS: Record<string, { title: MessageId; description: MessageId }> = {
  appointment_reminder: {
    title: 'businessNotificationTypeAppointmentReminder',
    description: 'businessNotificationTypeAppointmentReminderDescription',
  },
};

const CHANNEL_LABELS: Record<string, MessageId> = {
  push: 'businessNotificationChannelPush',
  email: 'businessNotificationChannelEmail',
};

type Text = (id: MessageId) => string;

export function notificationTypeTitle(text: Text, typeCode: string, storedName: string): string {
  const label = TYPE_LABELS[typeCode];
  return label ? text(label.title) : storedName;
}

export function notificationTypeDescription(text: Text, typeCode: string, storedDescription: string): string {
  const label = TYPE_LABELS[typeCode];
  return label ? text(label.description) : storedDescription;
}

export function notificationChannelLabel(text: Text, channelCode: string, storedName: string): string {
  const label = CHANNEL_LABELS[channelCode];
  return label ? text(label) : storedName;
}
