import { createFileRoute } from '@tanstack/react-router';

import { blockedSlotDetailQueryOptions, BlockedSlotFormScreen } from '@/features/schedule';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/blocked-slots/$blockedSlotId/form')({
  staticData: { screen: 'blockedSlotForm' },
  loader: ({ context, params }) => {
    void context.queryClient.query(blockedSlotDetailQueryOptions(params.blockedSlotId)).catch(ignore);
  },
  component: BlockedSlotFormScreen,
});
