/**
 * Query-key prefixes of the screens a live event refreshes. They match the key factories in
 * appointments, dashboard, availability, slot-watches, schedule, and users. This model cannot
 * import those features, so the prefixes are copied here.
 */
export type ActivityQueryKey = readonly unknown[];

export type ActivityPayload = {
  appointmentPublicId?: string;
  serviceId?: string;
  customerName?: string;
  businessDay?: string;
  previousStart?: string;
  nextStart?: string;
  userId?: string;
  slotWatchId?: string;
  channel?: string;
};

const APPOINTMENT_KINDS = new Set([
  'appointment.booked',
  'appointment.created',
  'appointment.rescheduled',
  'appointment.cancelled',
  'appointment.status_changed',
  'appointment.deleted',
]);

const SLOT_WATCH_KINDS = new Set(['slot_watch.created', 'slot_watch.cancelled', 'slot_watch.hold_released']);

const BLOCKED_SLOT_KINDS = new Set(['blocked_slot.created', 'blocked_slot.updated', 'blocked_slot.deleted']);

const RECURRING_BLOCK_KINDS = new Set([
  'recurring_block.created',
  'recurring_block.updated',
  'recurring_block.deleted',
  'recurring_block.exception_created',
]);

const CLIENT_KINDS = new Set([
  'client.registered',
  'client.created',
  'client.updated',
  'client.deleted',
  'client.account_deleted',
]);

/** Keys an event invalidates. Active queries under those prefixes refetch; nothing else does. */
export function queryKeysForKind(kind: string, payload: ActivityPayload): ActivityQueryKey[] {
  if (APPOINTMENT_KINDS.has(kind)) {
    const keys: ActivityQueryKey[] = [
      ['appointments', 'list'],
      ['dashboard', 'summary'],
      ['availability'],
      ['appointments', 'availability'],
    ];
    const appointmentId = text(payload.appointmentPublicId);
    if (appointmentId) keys.push(['appointments', 'detail', appointmentId]);
    return keys;
  }
  if (SLOT_WATCH_KINDS.has(kind)) return [['slot-watches', 'list']];
  if (BLOCKED_SLOT_KINDS.has(kind))
    return [
      ['schedule', 'blockedSlots'],
      ['appointments', 'agenda'],
    ];
  if (RECURRING_BLOCK_KINDS.has(kind))
    return [
      ['schedule', 'rules'],
      ['appointments', 'agenda'],
    ];
  if (kind === 'working_hours.changed') {
    return [
      ['schedule', 'workingHours'],
      ['appointments', 'agenda', 'working-hours'],
    ];
  }
  if (CLIENT_KINDS.has(kind)) {
    const keys: ActivityQueryKey[] = [['users', 'list']];
    const userId = text(payload.userId);
    if (userId) keys.push(['users', 'detail', userId]);
    return keys;
  }
  return [];
}

/** Every family in {@link queryKeysForKind}, without a specific id. A `reset` invalidates these. */
export function queryKeysForReset(): ActivityQueryKey[] {
  return [
    ['appointments', 'list'],
    ['appointments', 'detail'],
    ['dashboard', 'summary'],
    ['availability'],
    ['appointments', 'availability'],
    ['slot-watches', 'list'],
    ['schedule', 'blockedSlots'],
    ['appointments', 'agenda'],
    ['schedule', 'rules'],
    ['schedule', 'workingHours'],
    ['appointments', 'agenda', 'working-hours'],
    ['users', 'list'],
    ['users', 'detail'],
  ];
}

function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
}

/** One notice the bell and the toast share. The payload stays untranslated. */
export type ActivityItem = {
  id: number;
  kind: string;
  announce: boolean;
  payload: ActivityPayload;
};
