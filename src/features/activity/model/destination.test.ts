import { destination } from './destination';

describe('destination', () => {
  it('opens the appointment, the slot-watch day, or the client', () => {
    expect(destination('appointment.booked', { appointmentPublicId: 'apt-1' })).toEqual({
      to: '/appointments/$appointmentId',
      params: { appointmentId: 'apt-1' },
    });
    expect(destination('appointment.rescheduled', { appointmentPublicId: 'apt-2' })).toEqual({
      to: '/appointments/$appointmentId',
      params: { appointmentId: 'apt-2' },
    });
    expect(destination('appointment.cancelled', {})).toEqual({ to: '/appointments' });
    expect(destination('slot_watch.created', { businessDay: '2026-10-21' })).toEqual({
      to: '/schedule/slot-watches',
      search: { date: '2026-10-21' },
    });
    expect(destination('slot_watch.cancelled', { businessDay: 'not-a-day' })).toEqual({
      to: '/schedule/slot-watches',
    });
    expect(destination('slot_watch.hold_released', {})).toEqual({ to: '/schedule/slot-watches' });
    expect(destination('client.registered', { userId: 'user-1' })).toEqual({
      to: '/clients/$clientId',
      params: { clientId: 'user-1' },
    });
    expect(destination('client.registered', {})).toEqual({ to: '/clients' });
    expect(destination('client.account_deleted', { userId: 'user-1' })).toEqual({ to: '/clients' });
  });

  it('has nowhere to go for a kind the bell does not announce', () => {
    expect(destination('appointment.created', { appointmentPublicId: 'apt-1' })).toBeNull();
    expect(destination('blocked_slot.created', {})).toBeNull();
  });
});
