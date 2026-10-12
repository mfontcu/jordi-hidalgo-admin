import { useQueries } from '@tanstack/react-query';

import {
  bookingSettingsQueryOptions,
  businessInfoQueryOptions,
  gallerySlidesQueryOptions,
  legalDocumentsQueryOptions,
  notificationsQueryOptions,
  webPagesQueryOptions,
} from '../api/business.queries';
import type { BusinessTab } from '../model/business-tab';

type TabQuery = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
};

/**
 * Loads every business resource. Each tab reports its own pending/error so a failed gallery does
 * not block editing info.
 */
export function useBusinessScreen() {
  const [info, booking, notifications, legal, web, gallery] = useQueries({
    queries: [
      businessInfoQueryOptions(),
      bookingSettingsQueryOptions(),
      notificationsQueryOptions(),
      legalDocumentsQueryOptions(),
      webPagesQueryOptions(),
      gallerySlidesQueryOptions(),
    ],
  });

  const byTab: Record<BusinessTab, TabQuery> = {
    info,
    booking,
    notifications,
    legal,
    web,
    gallery,
  };

  return {
    info: info.data,
    booking: booking.data,
    notifications: notifications.data ?? [],
    legal: legal.data ?? [],
    web: web.data ?? [],
    gallery: gallery.data ?? [],
    tabState: (tab: BusinessTab) => {
      const query = byTab[tab];
      return {
        isLoading: query.isPending,
        error: query.isError ? query.error : null,
        retry: () => {
          query.refetch();
        },
      };
    },
  };
}
