import type { MessageId } from '@/shared/i18n';

import type { ActivityNotice } from '../model/notice';

/** The message id and placeholders for a notice. The `<b>` tag is the word that carries the tone. */
export function messageOf(
  notice: ActivityNotice,
  name: string,
  when: string,
): { id: MessageId; values: Record<string, string> } {
  switch (notice.template) {
    case 'booked':
      return notice.service
        ? { id: 'activityAppointmentBooked', values: { name, service: notice.service, when } }
        : { id: 'activityAppointmentBookedPlain', values: { name, when } };
    case 'rescheduled':
      return notice.service
        ? { id: 'activityAppointmentRescheduled', values: { name, service: notice.service, when } }
        : { id: 'activityAppointmentRescheduledPlain', values: { name, when } };
    case 'cancelled':
      return notice.service
        ? { id: 'activityAppointmentCancelled', values: { name, service: notice.service, when } }
        : { id: 'activityAppointmentCancelledPlain', values: { name, when } };
    case 'slotWatchCreated':
      return notice.service
        ? { id: 'activitySlotWatchCreated', values: { name, service: notice.service, when } }
        : { id: 'activitySlotWatchCreatedPlain', values: { name, when } };
    case 'slotWatchCancelled':
      return notice.service
        ? { id: 'activitySlotWatchCancelled', values: { name, service: notice.service, when } }
        : { id: 'activitySlotWatchCancelledPlain', values: { name, when } };
    case 'slotWatchHoldReleased':
      return notice.service
        ? { id: 'activitySlotWatchHoldReleased', values: { name, service: notice.service, when } }
        : { id: 'activitySlotWatchHoldReleasedPlain', values: { name, when } };
    case 'clientRegistered':
      return { id: 'activityClientRegistered', values: { name } };
    case 'clientAccountDeleted':
      return { id: 'activityClientAccountDeleted', values: { name } };
  }
}
