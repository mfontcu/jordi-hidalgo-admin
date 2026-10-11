import { activeSectionFor, SIDEBAR_SECTIONS } from './sections';

describe('SIDEBAR_SECTIONS', () => {
  it('lists the 11 sections in the order of the Flutter sidebar', () => {
    expect(SIDEBAR_SECTIONS.map((section) => section.path)).toEqual([
      '/',
      '/schedule/availability',
      '/appointments',
      '/schedule/day-agenda',
      '/schedule/slot-watches',
      '/schedule/blocked-slots',
      '/schedule/working-hours',
      '/services',
      '/clients',
      '/admins',
      '/business',
    ]);
  });
});

describe('activeSectionFor', () => {
  it.each([
    ['/', '/'],
    ['/appointments', '/appointments'],
    ['/appointments/a1/reschedule', '/appointments'],
    ['/appointments/form', '/appointments'],
    ['/services/s1/form', '/services'],
    ['/clients/c1', '/clients'],
    ['/admins/form', '/admins'],
    ['/business', '/business'],
    ['/schedule/blocked-slots/b1/form', '/schedule/blocked-slots'],
    ['/schedule/recurring-blocked-slots/r1', '/schedule/blocked-slots'],
    ['/schedule/working-hours', '/schedule/working-hours'],
    ['/schedule/availability', '/schedule/availability'],
    ['/schedule/slot-watches', '/schedule/slot-watches'],
    ['/schedule/day-agenda', '/schedule/day-agenda'],
    ['/somewhere/else', '/'],
  ])('highlights the section of the path prefix: %s → %s', (pathname, section) => {
    expect(activeSectionFor(pathname)).toBe(section);
  });

  it('prefers the sidebar parameter when it names a section', () => {
    expect(activeSectionFor('/clients/form', '/appointments')).toBe('/appointments');
    expect(activeSectionFor('/clients/form', ' /schedule/availability ')).toBe('/schedule/availability');
  });

  it('ignores a sidebar parameter that is not a section', () => {
    expect(activeSectionFor('/clients/form', '/clients/form')).toBe('/clients');
    expect(activeSectionFor('/clients/form', 42)).toBe('/clients');
  });
});
