/**
 * Query keys of the business feature, by backend resource. Writes invalidate the lists or
 * singles they change; the screen loads every resource together on entry.
 */
export const businessKeys = {
  all: ['business'] as const,
  info: () => [...businessKeys.all, 'info'] as const,
  bookingSettings: () => [...businessKeys.all, 'bookingSettings'] as const,
  notifications: () => [...businessKeys.all, 'notifications'] as const,
  legal: () => [...businessKeys.all, 'legal'] as const,
  webPages: () => [...businessKeys.all, 'webPages'] as const,
  gallery: () => [...businessKeys.all, 'gallery'] as const,
};
