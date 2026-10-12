import { dashboardLayoutFor, nextAppointmentTime, type NextAppointment } from './dashboard';

const next = (startAt: string): NextAppointment => ({
  id: 'a-1',
  startAt,
  serviceName: 'Corte',
  customerName: 'Ana',
  customerAvatarUrl: null,
});

describe('dashboard', () => {
  it('prints the next appointment in salon time, and nothing when there is no appointment', () => {
    // 08:00 UTC is 10:00 in Madrid on 12 October (CEST).
    expect(nextAppointmentTime(next('2026-10-12T08:00:00Z'), 'es')).toBe('10:00');
    expect(nextAppointmentTime(next('2026-01-12T09:00:00Z'), 'en')).toBe('10:00');
    expect(nextAppointmentTime(null, 'es')).toBeNull();
    expect(nextAppointmentTime(next('not-a-time'), 'es')).toBeNull();
  });

  it('follows the Flutter column counts, and clamps the hero title to 24 or 30', () => {
    expect(dashboardLayoutFor(400)).toMatchObject({ statsColumns: 1, actionColumns: 1, heroTitleSize: 24 });
    expect(dashboardLayoutFor(700)).toMatchObject({ statsColumns: 2, actionColumns: 2, heroTitleSize: 24 });
    expect(dashboardLayoutFor(1000)).toMatchObject({ statsColumns: 3, actionColumns: 3, heroTitleSize: 30 });
    expect(dashboardLayoutFor(1400)).toMatchObject({ statsColumns: 4, actionColumns: 4, heroTitleSize: 30 });
  });
});
