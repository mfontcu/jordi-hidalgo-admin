import {
  blockedSlotDayRange,
  blockedSlotFormDefaults,
  blockedSlotFormSchema,
  previewTimeRange,
  rangeChanged,
  type BlockedSlotFormInput,
} from './blocked-slot-form';

const input = (overrides: Partial<BlockedSlotFormInput> = {}): BlockedSlotFormInput => ({
  day: '2026-10-20',
  fullDay: false,
  start: '10:00',
  end: '12:00',
  reason: ' Formación ',
  showOnPublicSite: true,
  ...overrides,
});

const errors = (value: BlockedSlotFormInput): Record<string, string> => {
  const result = blockedSlotFormSchema.safeParse(value);
  if (result.success) return {};
  const found: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') found[field] = issue.message;
  }
  return found;
};

describe('blocked slot form', () => {
  it('sends the salon day and times as instants', () => {
    expect(blockedSlotFormSchema.parse(input())).toEqual({
      startAt: '2026-10-20T08:00:00.000Z',
      endAt: '2026-10-20T10:00:00.000Z',
      reason: 'Formación',
      showOnPublicSite: true,
    });
  });

  it('sends a full day from 00:00 to 23:59 in salon time, on a daylight-saving day too', () => {
    expect(
      blockedSlotFormSchema.parse(input({ day: '2026-03-29', fullDay: true, start: null, end: null })),
    ).toMatchObject({
      startAt: '2026-03-28T23:00:00.000Z',
      endAt: '2026-03-29T21:59:00.000Z',
    });
    expect(blockedSlotFormSchema.parse(input({ day: '2026-10-25', fullDay: true }))).toMatchObject({
      startAt: '2026-10-24T22:00:00.000Z',
      endAt: '2026-10-25T22:59:00.000Z',
    });
  });

  it('reports each missing value under its field, and an end before the start', () => {
    expect(errors(input({ day: '', start: null, end: null, reason: ' ' }))).toEqual({
      day: 'scheduleBlockedSlotFormValidationDate',
      start: 'scheduleBlockedSlotFormValidationTime',
      end: 'scheduleBlockedSlotFormValidationTime',
      reason: 'scheduleBlockedSlotFormValidationReason',
    });
    expect(errors(input({ start: '12:00', end: '11:00' }))).toEqual({
      end: 'scheduleValidationEndAfterStart',
    });
    expect(errors(input({ fullDay: true, start: null, end: null }))).toEqual({});
    expect(errors(input({ reason: 'a'.repeat(501) }))).toEqual({
      reason: 'scheduleBlockedSlotFormValidationReasonLength',
    });
    expect(blockedSlotFormSchema.parse(input({ reason: ` ${'a'.repeat(500)} ` })).reason).toBe(
      'a'.repeat(500),
    );
  });

  it('starts an edit from the stored block in salon time', () => {
    const slot = {
      id: 'b',
      startAt: '2026-06-22T22:00:00Z',
      endAt: '2026-06-23T21:59:00Z',
      reason: 'festivo local',
      showOnPublicSite: false,
    };
    expect(blockedSlotFormDefaults(slot)).toEqual({
      day: '2026-06-23',
      fullDay: true,
      start: '00:00',
      end: '23:59',
      reason: 'festivo local',
      showOnPublicSite: false,
    });
    expect(blockedSlotFormDefaults(null)).toMatchObject({ day: '', start: null, showOnPublicSite: true });
    const moved = blockedSlotFormSchema.parse(input({ day: '2026-06-23', fullDay: true }));
    expect(
      rangeChanged(slot, {
        ...moved,
        startAt: '2026-06-22T22:00:00.000Z',
        endAt: '2026-06-23T21:59:00.000Z',
      }),
    ).toBe(false);
    expect(rangeChanged(slot, moved)).toBe(false);
    expect(rangeChanged(slot, blockedSlotFormSchema.parse(input()))).toBe(true);
  });

  it('offers from today, or the stored day when earlier, to three years ahead', () => {
    expect(blockedSlotDayRange('2026-10-12', null)).toEqual({ first: '2026-10-12', last: '2029-10-11' });
    expect(blockedSlotDayRange('2026-10-12', '2026-06-23').first).toBe('2026-06-23');
    expect(blockedSlotDayRange('2026-10-12', '2026-12-01').first).toBe('2026-10-12');
  });

  it('previews the hours, with a dash for a missing time', () => {
    expect(previewTimeRange({ fullDay: false, start: '10:00', end: null })).toBe('10:00 - --:--');
    expect(previewTimeRange({ fullDay: true, start: null, end: null })).toBeNull();
  });
});
