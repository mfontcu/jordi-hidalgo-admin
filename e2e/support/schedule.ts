import type { MockBackend } from './backend';

const LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type Shift = { id: string; weekday: number; startTime: string; endTime: string; isActive: boolean };
type Rule = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  reason: string;
  is_active: boolean;
};
type Body = Record<string, unknown>;

const STAMP = '2026-10-01T08:00:00Z';

const SEED_RULE: Rule = {
  id: 'r-1',
  weekday: 1,
  start_time: '13:00',
  end_time: '16:00',
  reason: 'Comida',
  is_active: true,
};

const SEED_SLOT: Body = {
  id: 'b-1',
  starts_at: '2026-10-12T08:00:00Z',
  ends_at: '2026-10-12T10:00:00Z',
  reason: 'Vacaciones',
  is_full_day: false,
  created_at: STAMP,
  updated_at: STAMP,
};

/**
 * Working hours, blocked slots, and recurring rules, mocked with state. Pass `appointment` when a
 * punctual block should collide with one agenda item (the schedule journey); otherwise the
 * appointments mock owns `GET /admin/appointments`.
 */
export function mockSchedule(backend: MockBackend, appointment?: { start: string; end: string }) {
  const week = LABELS.map((label, index) => ({
    weekday: index + 1,
    label,
    isActive: index < 6,
    slots:
      index < 6
        ? [
            {
              id: `m-${index + 1}`,
              weekday: index + 1,
              startTime: '09:00',
              endTime: '13:00',
              isActive: true,
            },
            {
              id: `a-${index + 1}`,
              weekday: index + 1,
              startTime: '16:00',
              endTime: '20:00',
              isActive: true,
            },
          ]
        : ([] as Shift[]),
  }));
  const hours = () => ({
    summary: { activeDays: 6, activeWeekendDays: 1, usualOpeningTime: '09:00', usualClosingTime: '20:00' },
    days: week,
  });
  backend.on('GET', '/admin/business-hours', { json: hours() });
  for (const day of week) {
    for (const shift of day.slots) {
      backend.on('PATCH', `/admin/business-hours/slots/${shift.id}`, (request) => {
        Object.assign(shift, request.postDataJSON() as Partial<Shift>);
        return { json: hours() };
      });
    }
  }

  const slots: Body[] = [{ ...SEED_SLOT }];
  const slotList = () => ({
    summary: { active_blocks: slots.length, full_day_closures: 0, partial_blocked_ranges: slots.length },
    items: slots,
  });
  backend.on('GET', '/admin/blocked-slots', () => ({ json: slotList() }));
  backend.on('GET', '/admin/blocked-slots/b-1', () => ({
    json: slots.find((slot) => slot.id === 'b-1') ?? SEED_SLOT,
  }));
  backend.on('POST', '/admin/blocked-slots', (request) => {
    const slot = { ...(request.postDataJSON() as Body), id: 'blk-new', created_at: STAMP, updated_at: STAMP };
    slots.push(slot);
    backend.on('GET', '/admin/blocked-slots/blk-new', { json: slot });
    return { status: 201, json: slot };
  });

  if (appointment) {
    const agenda = {
      id: 'apt-blk',
      userId: 'c-1',
      appointmentStart: appointment.start,
      appointmentEnd: appointment.end,
      status: 'confirmed',
      customerNotes: '',
      internalNotes: 'Viene con su hijo',
      service: { id: 'svc-1', name: 'Corte', durationMinutes: 30, priceCents: 1500 },
      user: { id: 'c-1', fullName: 'Mari Puig', avatarUrl: '' },
    };
    backend.on('GET', '/admin/appointments', () => ({
      json: {
        items: [agenda],
        pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
        summary: {},
      },
    }));
    backend.on('PATCH', `/admin/appointments/${agenda.id}/cancel`, () => {
      agenda.status = 'cancelled';
      return { json: agenda };
    });
  }

  const rules: Rule[] = [{ ...SEED_RULE }];
  const exceptions: Body[] = [];
  const ruleDto = (rule: Rule) => ({ ...rule, created_at: STAMP, updated_at: STAMP });
  backend.on('GET', '/admin/recurring-blocked-slots', () => ({
    json: {
      summary: {
        active_rules: rules.length,
        affected_days: rules.length,
        weekly_blocked_ranges: rules.length,
      },
      items: rules.map(ruleDto),
    },
  }));
  backend.on('GET', '/admin/recurring-blocked-slots/r-1', () => ({
    json: ruleDto(rules.find((rule) => rule.id === 'r-1') ?? SEED_RULE),
  }));
  backend.on('GET', '/admin/recurring-blocked-slots/r-1/exceptions', () => ({ json: exceptions }));
  backend.on('POST', '/admin/recurring-blocked-slots', (request) => {
    const rule = { ...(request.postDataJSON() as Omit<Rule, 'id'>), id: 'rule-new' };
    rules.push(rule);
    const dto = () => ruleDto(rule);
    backend.on('GET', '/admin/recurring-blocked-slots/rule-new', () => ({ json: dto() }));
    backend.on('GET', '/admin/recurring-blocked-slots/rule-new/exceptions', () => ({ json: exceptions }));
    backend.on('POST', '/admin/recurring-blocked-slots/rule-new/exceptions', (exceptionRequest) => {
      const exception = {
        ...(exceptionRequest.postDataJSON() as Body),
        id: `exc-${exceptions.length + 1}`,
        recurring_blocked_slot_id: 'rule-new',
        created_at: STAMP,
        updated_at: STAMP,
      };
      exceptions.unshift(exception);
      return { status: 201, json: exception };
    });
    return { status: 201, json: dto() };
  });
}
