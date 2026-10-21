import { queryKeysForKind, queryKeysForReset } from './refresh';

describe('queryKeysForKind', () => {
  it('refreshes appointment screens, and the detail when the payload has an id', () => {
    expect(queryKeysForKind('appointment.booked', { appointmentPublicId: 'apt-1' })).toEqual([
      ['appointments', 'list'],
      ['dashboard', 'summary'],
      ['availability'],
      ['appointments', 'availability'],
      ['appointments', 'detail', 'apt-1'],
    ]);
    expect(queryKeysForKind('appointment.created', {})).toEqual([
      ['appointments', 'list'],
      ['dashboard', 'summary'],
      ['availability'],
      ['appointments', 'availability'],
    ]);
    expect(queryKeysForKind('appointment.deleted', { appointmentPublicId: 'apt-9' })).toContainEqual([
      'appointments',
      'detail',
      'apt-9',
    ]);
  });

  it('refreshes slot watches, blocks, hours, and clients', () => {
    expect(queryKeysForKind('slot_watch.hold_released', {})).toEqual([['slot-watches', 'list']]);
    expect(queryKeysForKind('blocked_slot.updated', {})).toEqual([
      ['schedule', 'blockedSlots'],
      ['appointments', 'agenda'],
    ]);
    expect(queryKeysForKind('recurring_block.exception_created', {})).toEqual([
      ['schedule', 'rules'],
      ['appointments', 'agenda'],
    ]);
    expect(queryKeysForKind('working_hours.changed', {})).toEqual([
      ['schedule', 'workingHours'],
      ['appointments', 'agenda', 'working-hours'],
    ]);
    expect(queryKeysForKind('client.registered', { userId: 'user-1' })).toEqual([
      ['users', 'list'],
      ['users', 'detail', 'user-1'],
    ]);
    expect(queryKeysForKind('client.account_deleted', {})).toEqual([['users', 'list']]);
  });

  it('ignores a kind outside the map', () => {
    expect(queryKeysForKind('gallery.changed', {})).toEqual([]);
  });
});

describe('queryKeysForReset', () => {
  it('invalidates every family at once, including open details', () => {
    expect(queryKeysForReset()).toEqual([
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
    ]);
  });
});
