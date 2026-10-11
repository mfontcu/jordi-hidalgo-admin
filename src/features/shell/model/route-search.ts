import { z } from 'zod';

import { SECTION_PATHS } from './sections';

// Search parameters of the signed-in routes (AdminRouter). An invalid value is dropped, never an
// error: the screen opens as if the parameter were missing. The router parses values as JSON
// first, so `?clientId=12` arrives as a number and is turned back into text.

/** Optional free text: trimmed, and missing when empty. */
const text = z
  .preprocess((value) => (typeof value === 'number' ? String(value) : value), z.string().trim().min(1))
  .optional()
  .catch(undefined);

/** `sidebar`: the section to highlight on a child route (AdminRouter.preservingSidebar). */
export const sidebarSearchSchema = z.object({
  sidebar: z.enum(SECTION_PATHS).optional().catch(undefined),
});

export const BLOCKED_SLOT_TABS = ['punctual', 'recurring'] as const;
export type BlockedSlotTab = (typeof BLOCKED_SLOT_TABS)[number];

/** `/schedule/blocked-slots?tab=`. */
export const blockedSlotsSearchSchema = z.object({
  tab: z.enum(BLOCKED_SLOT_TABS).optional().catch(undefined),
});

export const BUSINESS_TABS = ['info', 'booking', 'notifications', 'legal', 'web', 'gallery'] as const;
export type BusinessTab = (typeof BUSINESS_TABS)[number];

/** `/business?tab=`. */
export const businessSearchSchema = z.object({
  tab: z.enum(BUSINESS_TABS).optional().catch(undefined),
});

/** `backLabel`: the label of the back button when a screen was opened from another section. */
export const backLabelSearchSchema = z.object({ backLabel: text });

/** `/appointments/form` prefill (AdminRouter.appointmentFormPath). */
export const appointmentFormSearchSchema = z.object({
  clientId: text,
  clientLabel: text,
  backLabel: text,
  // Only the text `true` locks the client, as in Flutter; the router parses it as a boolean.
  lockInitialUser: z
    .preprocess(
      (value) => (value === true || value === 'true' ? true : undefined),
      z.literal(true).optional(),
    )
    .catch(undefined),
  prefillServiceId: text,
  prefillDate: text,
  prefillTime: text,
});

export type AppointmentFormSearch = z.infer<typeof appointmentFormSearchSchema>;
