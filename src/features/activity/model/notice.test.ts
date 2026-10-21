import { activityBadge, activityMoment, activityNotice } from './notice';

const atTenThirty = { day: 'today' as const, date: '', time: '10:30' };
const atNine = { day: 'unknown' as const, date: '', time: '09:00' };

describe('activityNotice', () => {
  it('keeps the service name when the catalog has one', () => {
    expect(activityNotice('appointment.booked', { customerName: 'Ana Ruiz' }, 'Corte', atTenThirty)).toEqual({
      template: 'booked',
      name: 'Ana Ruiz',
      service: 'Corte',
      moment: atTenThirty,
    });
  });

  it('drops the service when the catalog has no name', () => {
    expect(activityNotice('appointment.cancelled', { customerName: 'Ana Ruiz' }, null, atTenThirty)).toEqual({
      template: 'cancelled',
      name: 'Ana Ruiz',
      service: null,
      moment: atTenThirty,
    });
    expect(activityNotice('slot_watch.created', { customerName: 'Ana' }, '  ', atNine)).toMatchObject({
      service: null,
    });
  });

  it('names a new account and a closed account without a time', () => {
    expect(activityNotice('client.registered', { customerName: 'Ana Ruiz' }, null, atNine)).toEqual({
      template: 'clientRegistered',
      name: 'Ana Ruiz',
    });
    expect(activityNotice('client.account_deleted', { customerName: 'Ana Ruiz' }, null, atNine)).toEqual({
      template: 'clientAccountDeleted',
      name: 'Ana Ruiz',
    });
  });

  it('returns nothing for a kind that does not announce', () => {
    expect(activityNotice('appointment.created', { customerName: 'Ana' }, 'Corte', atTenThirty)).toBeNull();
  });
});

describe('activityMoment', () => {
  const now = Date.parse('2026-10-21T08:30:00Z');

  it('names today, tomorrow, and any other salon day', () => {
    expect(activityMoment({ nextStart: '2026-10-21T08:30:00Z' }, 'es', now)).toEqual({
      day: 'today',
      date: '',
      time: '10:30',
    });
    expect(activityMoment({ nextStart: '2026-10-22T08:30:00Z' }, 'es', now)).toEqual({
      day: 'tomorrow',
      date: '',
      time: '10:30',
    });
    expect(activityMoment({ businessDay: '2026-10-25' }, 'es', now)).toEqual({
      day: 'date',
      date: '25 oct',
      time: '—',
    });
  });

  it('uses an em dash when the payload has no instant', () => {
    expect(activityMoment({}, 'es', now)).toEqual({ day: 'unknown', date: '', time: '—' });
  });
});

describe('activityBadge', () => {
  it('hides zero, shows the count, and caps above 9', () => {
    expect(activityBadge(0, '9+')).toBeNull();
    expect(activityBadge(9, '9+')).toBe('9');
    expect(activityBadge(10, '9+')).toBe('9+');
  });
});
