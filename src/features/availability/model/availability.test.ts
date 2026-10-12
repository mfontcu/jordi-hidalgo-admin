import {
  availabilitySummaryOf,
  calendarLastDay,
  clampDay,
  defaultBookableDay,
  filterServices,
  isBookableDay,
} from './availability';

describe('availabilitySummaryOf', () => {
  it('counts free slots and the free percent', () => {
    expect(
      availabilitySummaryOf(
        [
          { time: '10:00', isAvailable: true },
          { time: '10:30', isAvailable: false },
          { time: '11:00', isAvailable: true },
        ],
        ['2026-10-12', '2026-10-13'],
      ),
    ).toEqual({
      availableSlotCount: 2,
      totalSlotCount: 3,
      bookableDayCount: 2,
      freePercentLabel: '67%',
      firstAvailableTime: '10:00',
      lastAvailableTime: '11:00',
    });
  });

  it('shows an em dash when there are no slots', () => {
    expect(availabilitySummaryOf([], []).freePercentLabel).toBe('—');
  });
});

describe('defaultBookableDay', () => {
  it('prefers today, then the next future day, then the latest past day', () => {
    expect(defaultBookableDay(['2026-10-12', '2026-10-14'], '2026-10-12')).toBe('2026-10-12');
    expect(defaultBookableDay(['2026-10-14', '2026-10-20'], '2026-10-12')).toBe('2026-10-14');
    expect(defaultBookableDay(['2026-10-01', '2026-10-05'], '2026-10-12')).toBe('2026-10-05');
    expect(defaultBookableDay([], '2026-10-12')).toBe('2026-10-12');
  });
});

describe('calendar bounds', () => {
  it('extends past the furthest bookable day when needed', () => {
    expect(calendarLastDay(['2026-10-12'], '2026-10-12')).toBe('2027-11-16');
    expect(calendarLastDay(['2028-01-01'], '2026-10-12')).toBe('2028-03-01');
  });

  it('clamps a day into the calendar', () => {
    expect(clampDay('2026-10-01', '2026-10-12', '2026-11-01')).toBe('2026-10-12');
    expect(clampDay('2026-12-01', '2026-10-12', '2026-11-01')).toBe('2026-11-01');
    expect(isBookableDay('2026-10-12', ['2026-10-12'])).toBe(true);
  });
});

describe('filterServices', () => {
  const services = [
    { id: '1', name: 'Corte', durationMinutes: 30, categoryLabel: 'Cabello', displayOrder: 1 },
    { id: '2', name: 'Barba', durationMinutes: 20, categoryLabel: 'Rostro', displayOrder: 2 },
  ];

  it('matches folded names and categories', () => {
    expect(filterServices(services, 'corte').map((item) => item.id)).toEqual(['1']);
    expect(filterServices(services, 'ROSTRO').map((item) => item.id)).toEqual(['2']);
  });
});
