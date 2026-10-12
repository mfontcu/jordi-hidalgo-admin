import {
  appointmentFormDefaults,
  createInputOf,
  pickAvailableDay,
  pickAvailableTime,
} from './appointment-form';

describe('appointment form', () => {
  it('prefills from the URL and defaults to confirmed', () => {
    expect(
      appointmentFormDefaults({
        clientId: 'cli-1',
        prefillServiceId: 'svc-1',
        prefillDate: '2026-10-12',
        prefillTime: '10:30',
      }),
    ).toEqual({
      userId: 'cli-1',
      serviceId: 'svc-1',
      day: '2026-10-12',
      time: '10:30',
      confirmed: true,
      internalNotes: '',
    });
    expect(appointmentFormDefaults({ prefillDate: 'not-a-day' }).day).toBe('');
  });

  it('builds the create body in salon time, and refuses a missing or occupied slot', () => {
    const slots = [
      { time: '10:00', isAvailable: true },
      { time: '10:30', isAvailable: false },
    ];
    expect(
      createInputOf(
        {
          userId: 'cli-1',
          serviceId: 'svc-1',
          day: '2026-10-12',
          time: '10:00',
          confirmed: true,
          internalNotes: '  Vip  ',
        },
        slots,
      ),
    ).toEqual({
      ok: true,
      input: {
        userId: 'cli-1',
        serviceId: 'svc-1',
        appointmentStart: '2026-10-12T08:00:00.000Z',
        status: 'confirmed',
        customerNotes: '',
        internalNotes: 'Vip',
      },
    });
    expect(
      createInputOf(
        {
          userId: '',
          serviceId: 'svc-1',
          day: '2026-10-12',
          time: '10:30',
          confirmed: false,
          internalNotes: '',
        },
        slots,
      ),
    ).toEqual({ ok: false, error: 'appointmentFormNoSlotsDay' });
    expect(
      createInputOf(
        {
          userId: '',
          serviceId: '',
          day: '',
          time: '',
          confirmed: true,
          internalNotes: '',
        },
        slots,
      ),
    ).toEqual({ ok: false, error: 'appointmentFormServiceRequired' });
  });

  it('picks the next available day and keeps a free preferred time', () => {
    expect(pickAvailableDay(['2026-10-14', '2026-10-12'], '2026-10-13')).toBe('2026-10-14');
    expect(pickAvailableDay(['2026-10-14', '2026-10-12'], '')).toBe('2026-10-12');
    expect(pickAvailableDay([], '2026-10-12')).toBe('');
    expect(pickAvailableTime([{ time: '10:00', isAvailable: true }], '10:00')).toBe('10:00');
    expect(pickAvailableTime([{ time: '10:00', isAvailable: false }], '10:00')).toBe('');
  });
});
