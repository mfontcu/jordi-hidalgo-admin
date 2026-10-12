import {
  blockedSlotDate,
  blockedSlotTimeRange,
  blockedSlotType,
  isFullDay,
  nextBlockedSlot,
  type BlockedSlot,
  type BlockedSlotPage,
} from './blocked-slot';

const slot = (startAt: string, endAt: string, id = 'b'): BlockedSlot => ({
  id,
  startAt,
  endAt,
  reason: '',
  showOnPublicSite: false,
});

describe('blocked slots', () => {
  it('prints the day as dd MMM y and the hours in salon time', () => {
    const range = slot('2026-10-05T07:00:00Z', '2026-10-05T09:30:00Z');
    expect(blockedSlotDate(range, 'es')).toBe('05 oct 2026');
    expect(blockedSlotTimeRange(range)).toBe('09:00 - 11:30');
    expect(blockedSlotType(range).label).toBe('scheduleBlockedSlotTypeRange');
  });

  it('takes 00:00 to 23:59 as a full day, also on the 23-hour spring day', () => {
    const spring = slot('2026-03-28T23:00:00Z', '2026-03-29T21:59:00Z');
    expect(isFullDay(spring)).toBe(true);
    expect(blockedSlotTimeRange(spring)).toBeNull();
    expect(blockedSlotType(spring)).toEqual({ label: 'scheduleBlockedSlotTypeFullDay', tone: 'warning' });
    expect(blockedSlotDate(spring, 'es')).toBe('29 mar 2026');
  });

  it("uses the summary's next block, else the first of the page that has not ended", () => {
    const page = (next: BlockedSlot | null, items: BlockedSlot[]): BlockedSlotPage => ({
      items,
      page: 1,
      pageSize: 10,
      totalItems: items.length,
      summary: { activeBlocks: 0, fullDayClosures: 0, partialRanges: 0, next },
    });
    const now = 1_791_806_400_000; // 2026-10-12T12:00:00Z
    const past = slot('2026-10-10T10:00:00Z', '2026-10-10T11:00:00Z', 'past');
    const later = slot('2026-10-20T10:00:00Z', '2026-10-20T11:00:00Z', 'later');
    const sooner = slot('2026-10-14T10:00:00Z', '2026-10-14T11:00:00Z', 'sooner');
    expect(nextBlockedSlot(page(null, [past, later, sooner]), now)?.id).toBe('sooner');
    expect(nextBlockedSlot(page(later, [sooner]), now)?.id).toBe('later');
    expect(nextBlockedSlot(page(null, [past]), now)).toBeNull();
  });
});
