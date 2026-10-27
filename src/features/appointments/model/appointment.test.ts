import {
  bulkCancellationOf,
  canReschedule,
  canSendCustomerPush,
  cancellationOf,
  conflictDetailsOf,
  conflictsOf,
  conflictTitleOf,
  isActiveChainEntry,
  isCorrectableStatus,
  pushBodyOf,
  pushDeliveryLabelOf,
  rangeCancellationOf,
  showsRescheduleChain,
  slotTakenMessageOf,
  statusTargetsOf,
  type AppointmentItem,
  isFinalStatus,
  messagePreviewOf,
  rowActionsOf,
  statusChangeOf,
  statusLabelOf,
  statusToneOf,
} from './appointment';

// 2026-10-12T09:00:00Z. Instants are parsed only in business-time.ts.
const now = 1_791_795_600_000;

describe('appointments in lists', () => {
  it('treats completed, cancelled, no-show, and rescheduled as final', () => {
    for (const status of ['completed', 'cancelled', 'no_show', 'Rescheduled'])
      expect(isFinalStatus(status)).toBe(true);
    for (const status of ['pending', 'confirmed', 'booked']) expect(isFinalStatus(status)).toBe(false);
  });

  it('cancels an open appointment, and completes it or marks a no-show once it has started', () => {
    expect(rowActionsOf({ status: 'confirmed', start: '2026-10-12T10:00:00Z' }, now)).toEqual({
      cancel: true,
      completeOrNoShow: false,
    });
    expect(rowActionsOf({ status: 'pending', start: '2026-10-12T09:00:00Z' }, now)).toEqual({
      cancel: true,
      completeOrNoShow: true,
    });
    expect(rowActionsOf({ status: 'completed', start: '2026-10-11T09:00:00Z' }, now)).toEqual({
      cancel: false,
      completeOrNoShow: false,
    });
  });

  it('labels and colors each status, and shows an unknown one as it comes', () => {
    expect(statusLabelOf(' No_Show ')).toBe('appointmentStatusNoShow');
    expect(statusLabelOf('booked')).toBeNull();
    expect(statusToneOf('pending')).toBe('warning');
    expect(statusToneOf('confirmed')).toBe('info');
    expect(statusToneOf('completed')).toBe('success');
    expect(statusToneOf('cancelled')).toBe('danger');
    expect(statusToneOf('no_show')).toBe('neutralStrong');
    expect(statusToneOf('rescheduled')).toBe('muted');
  });

  it('keeps the stored internal notes when the status changes', () => {
    expect(statusChangeOf({ internalNotes: 'Pagó por Bizum' }, 'completed')).toEqual({
      status: 'completed',
      internalNotes: 'Pagó por Bizum',
      cancellationReason: '',
    });
    expect(cancellationOf({ internalNotes: 'Llamar antes' })).toEqual({
      internalNotes: 'Llamar antes',
      cancellationReason: '',
    });
  });

  it('collapses the client message to one line, and shows a dash without one', () => {
    expect(messagePreviewOf('  Hola,\n\n  llego   tarde ')).toBe('Hola, llego tarde');
    expect(messagePreviewOf(' \n ')).toBe('—');
  });

  it('gates push and reschedule on a registered client', () => {
    expect(canSendCustomerPush('')).toBe(false);
    expect(canSendCustomerPush('cli-1')).toBe(true);
    expect(canReschedule('  ')).toBe(false);
    expect(canReschedule('cli-1')).toBe(true);
  });

  it('trims and caps the push body, and labels delivery statuses', () => {
    expect(pushBodyOf('  hola  ')).toBe('hola');
    expect(pushBodyOf('x'.repeat(300)).length).toBe(280);
    expect(pushDeliveryLabelOf('no_tokens')).toBe('customerPushDeliveryNoTokens');
    expect(pushDeliveryLabelOf('unknown')).toBeNull();
  });

  it('keeps notes on a bulk cancel and shows a chain of more than one revision', () => {
    expect(bulkCancellationOf({ internalNotes: 'nota' }, 'Festivo')).toEqual({
      internalNotes: 'nota',
      cancellationReason: 'Festivo',
    });
    expect(showsRescheduleChain(1)).toBe(false);
    expect(showsRescheduleChain(2)).toBe(true);
    expect(isActiveChainEntry('confirmed')).toBe(true);
    expect(isActiveChainEntry('rescheduled')).toBe(false);
  });
});

describe('appointments in a blocked range', () => {
  const item = (overrides: Partial<AppointmentItem>): AppointmentItem => ({
    id: 'a',
    userId: '',
    customerName: 'María',
    customerAvatarUrl: '',
    serviceId: 'svc-1',
    serviceName: 'Corte',
    customerPhone: '',
    customerEmail: '',
    start: '2026-10-20T08:00:00Z',
    end: '2026-10-20T08:30:00Z',
    status: 'confirmed',
    customerNotes: '',
    internalNotes: 'nota',
    ...overrides,
  });

  it('keeps the pending and confirmed ones that overlap, earliest first', () => {
    const items = [
      item({ id: 'late', start: '2026-10-20T09:00:00Z', end: '2026-10-20T09:30:00Z' }),
      item({ id: 'early' }),
      item({ id: 'cancelled', status: 'cancelled' }),
      item({ id: 'touching', start: '2026-10-20T10:00:00Z', end: '2026-10-20T10:30:00Z' }),
      item({ id: 'before', start: '2026-10-20T07:30:00Z', end: '2026-10-20T08:00:00Z', status: 'pending' }),
    ];
    expect(
      conflictsOf(items, '2026-10-20T08:00:00Z', '2026-10-20T10:00:00Z').map((found) => found.id),
    ).toEqual(['early', 'late']);
  });

  it('names a conflict by its client and lists its salon time and service', () => {
    expect(conflictTitleOf(item({ customerName: ' ' }))).toBe('a');
    expect(conflictDetailsOf(item({}))).toBe('10:00 · Corte');
    expect(rangeCancellationOf(item({}), 'Festivo')).toEqual({
      internalNotes: 'nota',
      cancellationReason: 'Festivo',
    });
  });
});

describe('status correction', () => {
  const future = '2026-10-12T10:00:00Z';
  const past = '2026-10-12T08:00:00Z';

  it('lets staff correct completed, cancelled, and no-show, not a rescheduled revision', () => {
    for (const status of ['completed', 'Cancelled', 'no_show'])
      expect(isCorrectableStatus(status)).toBe(true);
    for (const status of ['pending', 'confirmed', 'rescheduled', 'booked'])
      expect(isCorrectableStatus(status)).toBe(false);
  });

  it('offers every other settable status once the appointment has started', () => {
    expect(statusTargetsOf({ status: 'cancelled', start: past }, now)).toEqual([
      'pending',
      'confirmed',
      'completed',
      'no_show',
    ]);
    expect(statusTargetsOf({ status: 'no_show', start: past }, now)).toEqual([
      'pending',
      'confirmed',
      'completed',
      'cancelled',
    ]);
  });

  it('offers neither completed nor no-show before the start', () => {
    expect(statusTargetsOf({ status: 'cancelled', start: future }, now)).toEqual(['pending', 'confirmed']);
    expect(statusTargetsOf({ status: 'pending', start: future }, now)).toEqual(['confirmed', 'cancelled']);
  });

  it('offers nothing for a rescheduled revision', () => {
    expect(statusTargetsOf({ status: 'rescheduled', start: past }, now)).toEqual([]);
  });
});

describe('a reactivation refused because the slot is taken', () => {
  const appointment = {
    customerName: ' Ana García ',
    start: '2026-10-30T09:00:00Z',
    end: '2026-10-30T09:45:00Z',
  };

  it('names the appointment in the way', () => {
    expect(
      slotTakenMessageOf(
        appointment,
        {
          kind: 'appointment',
          start: '2026-10-30T09:15:00Z',
          end: '2026-10-30T09:45:00Z',
          customerName: 'Luis Pérez',
          serviceName: 'Corte',
        },
        'confirmed',
        'es',
      ),
    ).toEqual({
      id: 'appointmentReactivateSlotTakenByAppointment',
      values: {
        target: 'confirmed',
        hasCustomer: 'yes',
        customer: 'Ana García',
        when: '30 de octubre de 2026 · 10:00–10:45',
        hasOtherCustomer: 'yes',
        otherCustomer: 'Luis Pérez',
        hasOtherService: 'yes',
        otherService: 'Corte',
        otherFrom: '10:15',
        otherTo: '10:45',
      },
    });
  });

  it('drops the names the backend could not read', () => {
    const { values } = slotTakenMessageOf(
      { ...appointment, customerName: '' },
      {
        kind: 'appointment',
        start: '2026-10-30T09:15:00Z',
        end: '2026-10-30T09:45:00Z',
        customerName: '',
        serviceName: '',
      },
      'pending',
      'es',
    );
    expect(values).toMatchObject({ hasCustomer: 'no', hasOtherCustomer: 'no', hasOtherService: 'no' });
  });

  it('says until when a waiting customer holds the slot', () => {
    expect(
      slotTakenMessageOf(
        appointment,
        {
          kind: 'hold',
          start: '2026-10-30T09:00:00Z',
          end: '2026-10-30T09:30:00Z',
          holdExpiresAt: '2026-10-29T08:12:00Z',
        },
        'confirmed',
        'es',
      ),
    ).toMatchObject({ id: 'appointmentReactivateSlotTakenByHold', values: { holdUntil: '09:12' } });
  });
});
