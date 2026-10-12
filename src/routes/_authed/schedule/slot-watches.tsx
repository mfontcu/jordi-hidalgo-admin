import { createFileRoute } from '@tanstack/react-router';

import { slotWatchesQueryOptions, slotWatchesSearchSchema, SlotWatchesScreen } from '@/features/slot-watches';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/slot-watches')({
  staticData: { screen: 'slotWatches' },
  validateSearch: slotWatchesSearchSchema,
  loaderDeps: ({ search }) => ({ date: search.date ?? null }),
  loader: ({ context, deps }) => {
    void context.queryClient.query(slotWatchesQueryOptions(deps.date)).catch(ignore);
  },
  component: SlotWatchesScreen,
});
