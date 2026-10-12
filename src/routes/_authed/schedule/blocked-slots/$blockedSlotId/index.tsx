import { createFileRoute } from '@tanstack/react-router';

import { blockedSlotDetailQueryOptions, BlockedSlotDetailScreen } from '@/features/schedule';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/blocked-slots/$blockedSlotId/')({
  staticData: { screen: 'blockedSlotDetail' },
  loader: ({ context, params }) => {
    void context.queryClient.query(blockedSlotDetailQueryOptions(params.blockedSlotId)).catch(ignore);
  },
  component: BlockedSlotDetailScreen,
});
