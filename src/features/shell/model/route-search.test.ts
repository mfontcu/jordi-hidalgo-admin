import {
  appointmentFormSearchSchema,
  blockedSlotsSearchSchema,
  businessSearchSchema,
  clientFormSearchSchema,
  sidebarSearchSchema,
} from './route-search';

describe('sidebarSearchSchema', () => {
  it('keeps a section path and drops anything else', () => {
    expect(sidebarSearchSchema.parse({ sidebar: '/appointments' })).toEqual({ sidebar: '/appointments' });
    expect(sidebarSearchSchema.parse({ sidebar: '/nope' })).toEqual({ sidebar: undefined });
    expect(sidebarSearchSchema.parse({})).toEqual({});
  });
});

describe('tab schemas', () => {
  it('accept the Flutter tab slugs', () => {
    expect(blockedSlotsSearchSchema.parse({ tab: 'recurring' })).toEqual({ tab: 'recurring' });
    expect(businessSearchSchema.parse({ tab: 'gallery' })).toEqual({ tab: 'gallery' });
  });

  it('drop an unknown tab', () => {
    expect(blockedSlotsSearchSchema.parse({ tab: 'weekly' })).toEqual({ tab: undefined });
    expect(businessSearchSchema.parse({ tab: 3 })).toEqual({ tab: undefined });
  });
});

describe('appointmentFormSearchSchema', () => {
  it('reads every prefill parameter, as text', () => {
    expect(
      appointmentFormSearchSchema.parse({
        clientId: 12,
        clientLabel: ' Ana García ',
        backLabel: 'Ficha',
        lockInitialUser: true,
        prefillServiceId: 'svc-1',
        prefillDate: '2026-10-12',
        prefillTime: '10:30',
      }),
    ).toEqual({
      clientId: '12',
      clientLabel: 'Ana García',
      backLabel: 'Ficha',
      lockInitialUser: true,
      prefillServiceId: 'svc-1',
      prefillDate: '2026-10-12',
      prefillTime: '10:30',
    });
  });

  it('drops empty text and locks the client only on `true`', () => {
    const parsed = appointmentFormSearchSchema.parse({ clientId: '  ', lockInitialUser: 'yes' });
    expect(parsed.clientId).toBeUndefined();
    expect(parsed.lockInitialUser).toBeUndefined();
    expect(appointmentFormSearchSchema.parse({ lockInitialUser: 'true' }).lockInitialUser).toBe(true);
  });
});

describe('clientFormSearchSchema', () => {
  it('keeps the appointment form prefill to return to', () => {
    expect(
      clientFormSearchSchema.parse({
        returnTo: 'appointmentForm',
        appointment: { prefillServiceId: 'svc-1', prefillDate: '2026-10-20', backLabel: 'Volver a citas' },
      }),
    ).toEqual({
      returnTo: 'appointmentForm',
      appointment: { prefillServiceId: 'svc-1', prefillDate: '2026-10-20', backLabel: 'Volver a citas' },
    });
  });

  it('drops an unknown destination or prefill', () => {
    expect(clientFormSearchSchema.parse({ returnTo: 'dashboard', appointment: 'x' })).toEqual({});
  });
});
