import {
  clampPage,
  clientName,
  datesLabel,
  expiresLabel,
  filterWatches,
  holdClock,
  isHeld,
  isUpgrade,
  pageOf,
  serviceName,
  serviceOptions,
  shortDateTime,
  timeWindow,
  watchCounts,
  type SlotWatch,
} from './slot-watch';

const watch = (overrides: Partial<SlotWatch> = {}): SlotWatch => ({
  id: 'w-1',
  userId: 'u-1',
  userDisplayName: 'Ana Ruiz',
  userEmail: 'ana@example.com',
  serviceId: 'svc-1',
  serviceName: 'Corte',
  status: 'active',
  dates: ['2026-10-12', '2026-10-13'],
  timeFrom: '10:00',
  timeTo: '14:00',
  preferredStart: null,
  linkedAppointmentId: '',
  linkedAppointmentStart: null,
  linkedAppointmentStatus: '',
  heldSlotStart: null,
  holdExpiresAt: null,
  notifyCount: 0,
  expiresAt: '2026-10-20T10:00:00Z',
  createdAt: '2026-10-01T08:00:00Z',
  ...overrides,
});

describe('slot watch presentation', () => {
  it('names the client and the service, falling back when the label is blank', () => {
    expect(clientName(watch())).toBe('Ana Ruiz');
    expect(clientName(watch({ userDisplayName: '  ', userEmail: 'ana@example.com' }))).toBe(
      'ana@example.com',
    );
    expect(serviceName(watch({ serviceName: '', serviceId: 'svc-1' }))).toBe('svc-1');
  });

  it('treats a held watch and one linked to an appointment as such', () => {
    expect(isHeld(watch())).toBe(false);
    expect(isHeld(watch({ status: 'held' }))).toBe(true);
    expect(isUpgrade(watch())).toBe(false);
    expect(isUpgrade(watch({ linkedAppointmentId: 'a-1' }))).toBe(true);
  });

  it('describes the requested hours', () => {
    expect(timeWindow(watch())).toEqual({ kind: 'range', from: '10:00', to: '14:00' });
    expect(timeWindow(watch({ timeTo: '' }))).toEqual({ kind: 'from', from: '10:00' });
    expect(timeWindow(watch({ timeFrom: '', timeTo: '14:00' }))).toEqual({ kind: 'until', to: '14:00' });
    expect(timeWindow(watch({ timeFrom: '', timeTo: '' }))).toEqual({ kind: 'any' });
  });

  it('prints one full date, and short dates when several share a year', () => {
    expect(datesLabel(['2026-10-13', '2026-10-12'], 'es')).toBe('12/10, 13/10');
    expect(datesLabel(['2026-10-12'], 'es')).toBe('12/10/2026');
    expect(datesLabel(['2026-12-31', '2027-01-02'], 'es')).toBe('31/12/2026, 02/01/2027');
    expect(datesLabel([], 'es')).toBe('');
  });

  it('prints the expiry as the salon day, shortened', () => {
    // 22:30 UTC on the 12th is still the 13th in Madrid (CEST, UTC+2).
    expect(expiresLabel('2026-10-12T22:30:00Z', 'es')).toBe('13/10');
    expect(expiresLabel('', 'es')).toBe('—');
    expect(shortDateTime('2026-10-12T08:00:00Z', 'es')).toBe('12/10 10:00');
    expect(shortDateTime(null, 'es')).toBe('—');
  });

  it('reads the hold clock only for a held watch', () => {
    expect(holdClock(watch())).toBeNull();
    // 08:00 UTC is 10:00 in Madrid on 12 October.
    expect(holdClock(watch({ status: 'held', holdExpiresAt: '2026-10-12T08:00:00Z' }))).toBe('10:00');
  });
});

describe('slot watch list', () => {
  const items = [
    watch(),
    watch({
      id: 'w-2',
      userId: 'u-2',
      userDisplayName: 'Bruno',
      userEmail: 'bruno@example.com',
      serviceId: 'svc-2',
      serviceName: 'Barba',
      status: 'held',
      linkedAppointmentId: 'a-9',
      expiresAt: '2026-10-12T12:00:00Z',
    }),
  ];

  it('counts the loaded list, including watches that expire within 48 hours', () => {
    expect(watchCounts(items, '2026-10-12T08:00:00Z')).toEqual({
      active: 1,
      held: 1,
      upgrades: 1,
      expiringSoon: 1,
    });
  });

  it('lists the services by name', () => {
    expect(serviceOptions(items)).toEqual([
      { id: 'svc-2', name: 'Barba' },
      { id: 'svc-1', name: 'Corte' },
    ]);
  });

  it('filters by service, status, and name or email, without touching the other rows', () => {
    expect(filterWatches(items, { serviceId: 'svc-2', search: '' }).map((item) => item.id)).toEqual(['w-2']);
    expect(filterWatches(items, { status: 'active', search: '' }).map((item) => item.id)).toEqual(['w-1']);
    expect(filterWatches(items, { status: 'held', search: '' }).map((item) => item.id)).toEqual(['w-2']);
    expect(filterWatches(items, { search: 'ANA@' }).map((item) => item.id)).toEqual(['w-1']);
    expect(filterWatches(items, { search: 'bruno@example' }).map((item) => item.id)).toEqual(['w-2']);
  });

  it('pages the filtered rows and clamps a page past the end', () => {
    const filtered = filterWatches(items, { search: '' });
    expect(pageOf(filtered, 1, 1)).toHaveLength(1);
    expect(pageOf(filtered, 3, 1)).toEqual([]);
    expect(clampPage(2, 5, 10)).toBe(1);
    expect(clampPage(0, 3, 10)).toBe(1);
    expect(clampPage(25, 2, 10)).toBe(2);
  });
});
