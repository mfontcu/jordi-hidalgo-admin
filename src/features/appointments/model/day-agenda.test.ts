import { instantAt } from '@/shared/lib/business-time';

import type { AgendaAppointment, AgendaBlock, AgendaRecurringRule, AgendaWorkingDay } from './day-agenda';
import {
  agendaSummaryOf,
  blocksForDay,
  computeTimelineLayouts,
  expandRecurringBlocks,
  filterAgendaAppointments,
  isWorkingDayClosed,
  laneBlockWidth,
  laneLeft,
  matchesViewFilter,
  PIXELS_PER_MINUTE,
  servicesInDay,
  timelineRangeForDay,
  timelineRangeForWeek,
  timelineTotalMinutes,
} from './day-agenda';

const apt = (overrides: Partial<AgendaAppointment> = {}): AgendaAppointment => ({
  id: 'apt-1',
  userId: 'cli-1',
  customerName: 'María Pérez',
  customerAvatarUrl: '',
  serviceName: 'Corte',
  serviceId: 'svc-1',
  customerPhone: '+34600111222',
  customerEmail: 'maria@example.com',
  start: instantAt('2026-10-12', '10:00'),
  end: instantAt('2026-10-12', '10:30'),
  status: 'confirmed',
  customerNotes: '',
  internalNotes: '',
  ...overrides,
});

const workingDays: AgendaWorkingDay[] = [
  { weekday: 1, isActive: false, shifts: [] },
  {
    weekday: 2,
    isActive: true,
    shifts: [
      { start: '09:00', end: '13:00' },
      { start: '16:00', end: '20:00' },
    ],
  },
];

describe('timeline range', () => {
  it('uses the earliest and latest shifts of an open day', () => {
    expect(timelineRangeForDay('2026-10-13', workingDays)).toEqual({
      startMinutes: 9 * 60,
      endMinutes: 20 * 60,
    });
  });

  it('falls back to 08:00–21:00 on a closed day', () => {
    expect(timelineRangeForDay('2026-10-12', workingDays)).toEqual({
      startMinutes: 8 * 60,
      endMinutes: 21 * 60,
    });
    expect(isWorkingDayClosed(workingDays[0])).toBe(true);
  });

  it('spans a week from the earliest open to the latest close', () => {
    const range = timelineRangeForWeek(
      ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'],
      workingDays,
    );
    expect(range.startMinutes).toBe(8 * 60);
    expect(range.endMinutes).toBe(21 * 60);
  });
});

describe('computeTimelineLayouts', () => {
  it('stacks overlapping appointments in columns and sizes by pixelsPerMinute', () => {
    const first = apt({
      id: 'a',
      start: instantAt('2026-10-13', '10:00'),
      end: instantAt('2026-10-13', '11:00'),
    });
    const second = apt({
      id: 'b',
      start: instantAt('2026-10-13', '10:30'),
      end: instantAt('2026-10-13', '11:30'),
      status: 'pending',
    });
    const range = { startMinutes: 9 * 60, endMinutes: 20 * 60 };
    const layouts = computeTimelineLayouts([first, second], [], range);

    expect(layouts.appointments).toHaveLength(2);
    expect(layouts.appointments.every((item) => item.columnCount === 2)).toBe(true);
    expect(layouts.appointments.map((item) => item.column).sort()).toEqual([0, 1]);
    expect(layouts.appointments[0]?.height).toBe(60 * PIXELS_PER_MINUTE - 2);
    expect(timelineTotalMinutes(range) * PIXELS_PER_MINUTE).toBe(11 * 60 * PIXELS_PER_MINUTE);
  });

  it('puts a cancelled appointment in a later column when it overlaps an operational one', () => {
    const confirmed = apt({
      id: 'c',
      start: instantAt('2026-10-13', '10:00'),
      end: instantAt('2026-10-13', '10:30'),
    });
    const cancelled = apt({
      id: 'x',
      start: instantAt('2026-10-13', '10:00'),
      end: instantAt('2026-10-13', '10:30'),
      status: 'cancelled',
    });
    const layouts = computeTimelineLayouts([cancelled, confirmed], [], {
      startMinutes: 9 * 60,
      endMinutes: 20 * 60,
    });
    const byId = Object.fromEntries(layouts.appointments.map((item) => [item.appointment.id, item]));
    expect(byId.c?.column).toBe(0);
    expect(byId.x?.column).toBe(1);
  });

  it('lays out a blocked slot beside an appointment', () => {
    const block: AgendaBlock = {
      id: 'blk-1',
      startAt: instantAt('2026-10-13', '10:00'),
      endAt: instantAt('2026-10-13', '11:00'),
      reason: 'Formación',
      isRecurring: false,
    };
    const layouts = computeTimelineLayouts(
      [apt({ start: instantAt('2026-10-13', '10:15'), end: instantAt('2026-10-13', '10:45') })],
      [block],
      { startMinutes: 9 * 60, endMinutes: 20 * 60 },
    );
    expect(layouts.appointments).toHaveLength(1);
    expect(layouts.blockedSlots).toHaveLength(1);
    expect(layouts.appointments[0]?.columnCount).toBe(2);
  });

  it('computes lane geometry', () => {
    expect(laneBlockWidth(200, 2)).toBe((200 - 12 - 4) / 2);
    expect(laneLeft(200, 1, 2)).toBe(6 + (200 - 12 - 4) / 2 + 4);
  });
});

describe('filters and summary', () => {
  it('filters by view, search, and service', () => {
    const items = [
      apt({ id: '1', status: 'confirmed', customerName: 'Ana' }),
      apt({ id: '2', status: 'pending', customerName: 'Luis', serviceId: 'svc-2', serviceName: 'Barba' }),
      apt({ id: '3', status: 'cancelled', customerName: 'Ana' }),
    ];
    expect(
      filterAgendaAppointments(items, { viewFilter: 'operational', search: '', serviceId: null }),
    ).toHaveLength(2);
    expect(
      filterAgendaAppointments(items, { viewFilter: 'all', search: 'ana', serviceId: null }).map(
        (item) => item.id,
      ),
    ).toEqual(['1', '3']);
    expect(
      filterAgendaAppointments(items, { viewFilter: 'all', search: '', serviceId: 'svc-2' }).map(
        (item) => item.id,
      ),
    ).toEqual(['2']);
  });

  it('matches actionPending only after the start', () => {
    // 2026-10-12 11:00 Europe/Madrid (CEST) = 09:00Z
    const now = 1_791_795_600_000;
    expect(
      matchesViewFilter(
        apt({ status: 'confirmed', start: instantAt('2026-10-12', '10:00') }),
        'actionPending',
        now,
      ),
    ).toBe(true);
    expect(
      matchesViewFilter(
        apt({ status: 'confirmed', start: instantAt('2026-10-12', '12:00') }),
        'actionPending',
        now,
      ),
    ).toBe(false);
  });

  it('summarises confirmed as the total without listing filters', () => {
    const summary = agendaSummaryOf(
      [
        apt({ status: 'confirmed' }),
        apt({ id: '2', status: 'pending' }),
        apt({ id: '3', status: 'completed' }),
      ],
      false,
    );
    expect(summary).toEqual({
      total: 1,
      pending: 2,
      completed: 1,
      cancelled: 0,
      noShow: 0,
      rescheduled: 0,
    });
    expect(agendaSummaryOf([apt(), apt({ id: '2', status: 'pending' })], true).total).toBe(2);
  });

  it('lists distinct services of the day', () => {
    expect(
      servicesInDay([
        apt({ serviceId: 'svc-2', serviceName: 'Barba' }),
        apt({ id: '2', serviceId: 'svc-1', serviceName: 'Corte' }),
        apt({ id: '3', serviceId: 'svc-1', serviceName: 'Corte' }),
      ]),
    ).toEqual([
      { id: 'svc-2', name: 'Barba' },
      { id: 'svc-1', name: 'Corte' },
    ]);
  });
});

describe('blocked slots for a day', () => {
  it('expands an active recurring rule and keeps punctual overlaps', () => {
    const rules: AgendaRecurringRule[] = [
      {
        id: 'rule-1',
        weekday: 1,
        start: '11:00',
        end: '12:00',
        reason: 'Limpieza',
        isActive: true,
      },
      {
        id: 'rule-off',
        weekday: 1,
        start: '14:00',
        end: '15:00',
        reason: '',
        isActive: false,
      },
    ];
    const expanded = expandRecurringBlocks(rules, '2026-10-12');
    expect(expanded).toHaveLength(1);
    expect(expanded[0]?.id).toBe('recurring:rule-1');
    expect(expanded[0]?.isRecurring).toBe(true);

    const punctual: AgendaBlock[] = [
      {
        id: 'blk-1',
        startAt: instantAt('2026-10-12', '09:00'),
        endAt: instantAt('2026-10-12', '10:00'),
        reason: 'Formación',
        isRecurring: false,
      },
      {
        id: 'blk-other',
        startAt: instantAt('2026-10-13', '09:00'),
        endAt: instantAt('2026-10-13', '10:00'),
        reason: '',
        isRecurring: false,
      },
    ];
    expect(blocksForDay(punctual, rules, '2026-10-12').map((block) => block.id)).toEqual([
      'blk-1',
      'recurring:rule-1',
    ]);
  });
});
