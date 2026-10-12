import { createFileRoute } from '@tanstack/react-router';

import {
  bookingSettingsQueryOptions,
  BusinessScreen,
  businessInfoQueryOptions,
  gallerySlidesQueryOptions,
  legalDocumentsQueryOptions,
  notificationsQueryOptions,
  webPagesQueryOptions,
} from '@/features/business';
import { businessSearchSchema } from '@/features/shell';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/business')({
  validateSearch: businessSearchSchema,
  staticData: { screen: 'business' },
  loader: ({ context }) => {
    const { queryClient } = context;
    void queryClient.query(businessInfoQueryOptions()).catch(ignore);
    void queryClient.query(bookingSettingsQueryOptions()).catch(ignore);
    void queryClient.query(notificationsQueryOptions()).catch(ignore);
    void queryClient.query(legalDocumentsQueryOptions()).catch(ignore);
    void queryClient.query(webPagesQueryOptions()).catch(ignore);
    void queryClient.query(gallerySlidesQueryOptions()).catch(ignore);
  },
  component: BusinessScreen,
});
