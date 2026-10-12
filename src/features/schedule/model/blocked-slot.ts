import {
  clockTimeOfInstant,
  compareInstants,
  formatInstant,
  isFullDayRange,
  isFuture,
  type DateLocale,
} from '@/shared/lib/business-time';

// Punctual blocked slots (BlockedSlotsScreen, app_api AdminBlockedSlots): a closed salon day or a
// range of hours on one day. Instants stay as the API's ISO strings; business-time reads them in
// salon time.

export type BlockedSlot = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
  showOnPublicSite: boolean;
};

export type BlockedSlotsSummary = {
  activeBlocks: number;
  fullDayClosures: number;
  partialRanges: number;
  next: BlockedSlot | null;
};

export type BlockedSlotPage = {
  items: BlockedSlot[];
  page: number;
  pageSize: number;
  /**
   * Every block of the filters. The backend sends no total, but its summary counts the filtered
   * blocks as full days or ranges, so their sum is the total. Flutter loads one page of ten and
   * pages through those ten only, so it never shows the eleventh block.
   */
  totalItems: number;
  summary: BlockedSlotsSummary;
};

/** The page size of AdminBlockedSlotsController. */
export const BLOCKED_SLOTS_PAGE_SIZE = 10;

export function isFullDay(slot: Pick<BlockedSlot, 'startAt' | 'endAt'>): boolean {
  return isFullDayRange(slot.startAt, slot.endAt);
}

/** formatScheduleListDate: the block's day, `dd MMM y`. */
export function blockedSlotDate(slot: Pick<BlockedSlot, 'startAt'>, locale: DateLocale): string {
  return formatInstant(slot.startAt, locale, 'paddedListDate');
}

/**
 * scheduleBlockedSlotTimeLabel: "HH:mm - HH:mm" in salon time; null for a full day, which shows
 * its label instead.
 */
export function blockedSlotTimeRange(slot: Pick<BlockedSlot, 'startAt' | 'endAt'>): string | null {
  if (isFullDay(slot)) return null;
  return `${clockTimeOfInstant(slot.startAt) ?? '--:--'} - ${clockTimeOfInstant(slot.endAt) ?? '--:--'}`;
}

/** The type pill: a full day in amber, a range in blue. */
export function blockedSlotType(slot: Pick<BlockedSlot, 'startAt' | 'endAt'>) {
  return isFullDay(slot)
    ? ({ label: 'scheduleBlockedSlotTypeFullDay', tone: 'warning' } as const)
    : ({ label: 'scheduleBlockedSlotTypeRange', tone: 'info' } as const);
}

/** The web visibility pill: visible in green, hidden on the muted surface. */
export function blockedSlotVisibility(slot: Pick<BlockedSlot, 'showOnPublicSite'>) {
  return slot.showOnPublicSite
    ? ({ label: 'scheduleBlockedSlotShowOnPublicSite', tone: 'success' } as const)
    : ({ label: 'scheduleBlockedSlotHiddenFromPublicSite', tone: 'neutral' } as const);
}

/**
 * The "next block" card: the summary's, else the first block of the page that has not ended
 * (`_nextBlockedSlot`).
 */
export function nextBlockedSlot(page: BlockedSlotPage, now: number = Date.now()): BlockedSlot | null {
  if (page.summary.next) return page.summary.next;
  const coming = page.items
    .filter((slot) => isFuture(slot.endAt, now))
    .sort((a, b) => compareInstants(a.startAt, b.startAt));
  return coming[0] ?? null;
}
