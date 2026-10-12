import { clockTimeOfInstant, compareInstants, isPastOrNow } from '@/shared/lib/business-time';

// Appointments as the lists show them (AppointmentItemData) and the rules of their row actions
// (appointment_status_labels.dart, appointments_table.dart), plus the detail and summary of phase 8.

/** A row of an appointments list. `start` stays as the API's ISO instant. */
export type AppointmentItem = {
  id: string;
  /** The client's account; empty for an appointment without one. */
  userId: string;
  customerName: string;
  customerAvatarUrl: string;
  /** Empty when the API omits the nested service. */
  serviceId: string;
  serviceName: string;
  customerPhone: string;
  customerEmail: string;
  start: string;
  /** The API's end, else the start plus the service's duration. */
  end: string;
  /** The API's status, lower case; an unknown one shows as it comes. */
  status: string;
  customerNotes: string;
  /** Sent back with each status change, which replaces them (see `statusChangeOf`). */
  internalNotes: string;
};

/** Catalog summary of `GET /admin/appointments` (AdminAppointmentSummaryResponse). */
export type AppointmentSummary = {
  totalToday: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
  rescheduled: number;
  freeSlots: number;
};

export type AppointmentPage = {
  items: AppointmentItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  summary: AppointmentSummary;
};

/** Nested service of an appointment detail. */
export type AppointmentService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
};

/** Nested client of an appointment detail. */
export type AppointmentUser = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatarUrl: string;
};

/** One appointment as the detail screen shows it. */
export type AppointmentDetail = AppointmentItem & {
  cancellationReason: string;
  cancelledBy: string;
  replacesAppointmentId: string;
  rootAppointmentId: string;
  rescheduleChainLength: number;
  service: AppointmentService;
  user: AppointmentUser | null;
};

/** A past revision in the reschedule chain. */
export type RescheduleChainEntry = {
  id: string;
  start: string;
  end: string;
  status: string;
  rescheduledBy: string;
  createdAt: string;
};

/** A push the salon sent about this appointment. */
export type CustomerPushMessage = {
  id: string;
  appointmentId: string;
  recipientUserId: string;
  title: string;
  body: string;
  deliveryStatus: string;
  fcmSuccessCount: number;
  fcmFailureCount: number;
  readAt: string;
  createdAt: string;
};

/** An available day from `/availability/dates`. */
export type AvailableDay = { date: string };

/** A clock slot from `/availability/slots`. */
export type TimeSlot = { time: string; isAvailable: boolean };

/** What `GET /admin/appointments` receives for the appointments of one account. */
export type UserAppointmentsParams = { userId: string; page: number; pageSize: number };

/** The page size of AdminAppointmentsController. */
export const APPOINTMENTS_PAGE_SIZE = 10;

const FINAL_STATUSES = new Set(['completed', 'cancelled', 'no_show', 'rescheduled']);

/** isAppointmentFinalStatus: nothing more can happen to the appointment. */
export function isFinalStatus(status: string): boolean {
  return FINAL_STATUSES.has(status.trim().toLowerCase());
}

/** The actions of a row: cancel while it is open, complete or no-show once it has started too. */
export function rowActionsOf(item: Pick<AppointmentItem, 'status' | 'start'>, now: number = Date.now()) {
  const open = !isFinalStatus(item.status);
  return { cancel: open, completeOrNoShow: open && isPastOrNow(item.start, now) };
}

const STATUS_LABELS = {
  pending: 'appointmentStatusPending',
  confirmed: 'appointmentStatusConfirmed',
  completed: 'appointmentStatusCompleted',
  cancelled: 'appointmentStatusCancelled',
  no_show: 'appointmentStatusNoShow',
  rescheduled: 'appointmentStatusRescheduled',
} as const;

export type StatusLabelId = (typeof STATUS_LABELS)[keyof typeof STATUS_LABELS];

/** appointmentStatusLabel: the message of a known status, or null to show the status as it comes. */
export function statusLabelOf(status: string): StatusLabelId | null {
  const key = status.trim().toLowerCase();
  return key in STATUS_LABELS ? STATUS_LABELS[key as keyof typeof STATUS_LABELS] : null;
}

/**
 * adminAppointmentStatusColors: pending in amber, confirmed in blue, completed in green, cancelled
 * in red, a no-show on the muted surface, rescheduled in the muted text color.
 */
export function statusToneOf(status: string) {
  switch (status.trim().toLowerCase()) {
    case 'pending':
      return 'warning' as const;
    case 'confirmed':
      return 'info' as const;
    case 'completed':
      return 'success' as const;
    case 'cancelled':
      return 'danger' as const;
    case 'rescheduled':
      return 'muted' as const;
    default:
      return 'neutralStrong' as const;
  }
}

/**
 * A status change from a list: the new status with the appointment's stored internal notes. The
 * backend replaces the notes with what it receives; Flutter sends none and so clears them.
 */
export function statusChangeOf(
  item: Pick<AppointmentItem, 'internalNotes'>,
  status: 'completed' | 'no_show',
) {
  return { status, internalNotes: item.internalNotes, cancellationReason: '' };
}

/** A cancellation from a list: no reason, the stored internal notes kept. */
export function cancellationOf(item: Pick<AppointmentItem, 'internalNotes'>) {
  return { internalNotes: item.internalNotes, cancellationReason: '' };
}

/** isAppointmentBulkSelectable: only pending and confirmed appointments take bulk actions. */
export function isBulkSelectable(status: string): boolean {
  const key = status.trim().toLowerCase();
  return key === 'pending' || key === 'confirmed';
}

/**
 * The appointments a blocked range would leave in the agenda (findConflictingAppointments): pending
 * or confirmed ones that overlap it, the earliest first.
 */
export function conflictsOf(
  items: readonly AppointmentItem[],
  start: string,
  end: string,
): AppointmentItem[] {
  return items
    .filter(
      (item) =>
        isBulkSelectable(item.status) &&
        compareInstants(item.start, end) < 0 &&
        compareInstants(item.end, start) > 0,
    )
    .sort((a, b) => compareInstants(a.start, b.start));
}

/** blockedSlotConflictAppointmentDisplayName: the client's name, else the appointment's id. */
export function conflictTitleOf(item: Pick<AppointmentItem, 'customerName' | 'id'>): string {
  return item.customerName.trim() || item.id;
}

/** blockedSlotConflictAppointmentDetails: "HH:mm · service" in salon time. */
export function conflictDetailsOf(item: Pick<AppointmentItem, 'start' | 'serviceName'>): string {
  return `${clockTimeOfInstant(item.start) ?? ''} · ${item.serviceName}`;
}

/** A cancellation of a blocked range's appointments: the block's reason, the internal notes kept. */
export function rangeCancellationOf(item: Pick<AppointmentItem, 'internalNotes'>, reason: string) {
  return { internalNotes: item.internalNotes, cancellationReason: reason };
}

/**
 * `_AppointmentMessageCell`: the client's message on one line, its runs of spaces collapsed; a
 * dash without one.
 */
export function messagePreviewOf(message: string): string {
  return message.trim().replace(/\s+/g, ' ') || '—';
}

/** canSendCustomerPush: only a registered client can receive a push. */
export function canSendCustomerPush(userId: string): boolean {
  return userId.trim() !== '';
}

/** appointmentCannotRescheduleWithoutClient: reschedule needs a registered client. */
export function canReschedule(userId: string): boolean {
  return userId.trim() !== '';
}

/** customerPushMaxBodyLength. */
export const CUSTOMER_PUSH_MAX_LENGTH = 280;

/** Trims and caps the push body; empty when there is nothing to send. */
export function pushBodyOf(text: string): string {
  return text.trim().slice(0, CUSTOMER_PUSH_MAX_LENGTH);
}

const PUSH_DELIVERY_LABELS = {
  sent: 'customerPushDeliverySent',
  partial: 'customerPushDeliveryPartial',
  failed: 'customerPushDeliveryFailed',
  no_tokens: 'customerPushDeliveryNoTokens',
  pending: 'customerPushDeliveryPending',
} as const;

export type PushDeliveryLabelId = (typeof PUSH_DELIVERY_LABELS)[keyof typeof PUSH_DELIVERY_LABELS];

/** customerPushDeliveryLabel: the message of a known delivery status, or null. */
export function pushDeliveryLabelOf(status: string): PushDeliveryLabelId | null {
  const key = status.trim().toLowerCase();
  return key in PUSH_DELIVERY_LABELS ? PUSH_DELIVERY_LABELS[key as keyof typeof PUSH_DELIVERY_LABELS] : null;
}

/**
 * A cancellation from bulk select: the shared reason, each appointment's internal notes kept.
 * Flutter clears the notes; the panel keeps them.
 */
export function bulkCancellationOf(item: Pick<AppointmentItem, 'internalNotes'>, reason: string) {
  return { internalNotes: item.internalNotes, cancellationReason: reason };
}

/** Whether the reschedule chain section shows (rescheduleChainLength > 1). */
export function showsRescheduleChain(length: number): boolean {
  return length > 1;
}

/** The active entry of a chain: not itself marked rescheduled. */
export function isActiveChainEntry(status: string): boolean {
  return status.trim().toLowerCase() !== 'rescheduled';
}

/** formatPrice for an appointment's service. */
export function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} €`;
}
