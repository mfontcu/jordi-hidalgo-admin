import { toSlotConflict } from './appointments.mappers';

describe('the conflict of a refused status change', () => {
  it('reads an appointment in the way', () => {
    expect(
      toSlotConflict({
        error: 'appointment slot unavailable',
        conflict: {
          kind: 'appointment',
          start: '2026-10-30T09:15:00Z',
          end: '2026-10-30T09:45:00Z',
          appointmentId: 'apt-2',
          customerName: ' Luis Pérez ',
          serviceName: 'Corte',
        },
      }),
    ).toEqual({
      kind: 'appointment',
      start: '2026-10-30T09:15:00Z',
      end: '2026-10-30T09:45:00Z',
      customerName: 'Luis Pérez',
      serviceName: 'Corte',
    });
  });

  it('reads a slot-watch hold', () => {
    expect(
      toSlotConflict({
        conflict: {
          kind: 'hold',
          start: '2026-10-30T09:00:00Z',
          end: '2026-10-30T09:30:00Z',
          holdExpiresAt: '2026-10-29T08:12:00Z',
        },
      }),
    ).toEqual({
      kind: 'hold',
      start: '2026-10-30T09:00:00Z',
      end: '2026-10-30T09:30:00Z',
      holdExpiresAt: '2026-10-29T08:12:00Z',
    });
  });

  it('ignores a body without a usable conflict', () => {
    for (const body of [
      undefined,
      'appointment slot unavailable',
      {},
      { conflict: { kind: 'other', start: 'a', end: 'b' } },
      { conflict: { kind: 'hold' } },
    ])
      expect(toSlotConflict(body)).toBeNull();
  });
});
