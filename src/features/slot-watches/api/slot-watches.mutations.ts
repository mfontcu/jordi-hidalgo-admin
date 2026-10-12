import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { SlotWatch } from '../model/slot-watch';
import { slotWatchKeys } from './slot-watches.keys';

/** `POST /admin/slot-watches/{id}/cancel`, then drop the watch from every loaded list. */
export async function cancelSlotWatch(queryClient: QueryClient, watchId: string) {
  unwrap(
    await apiClient.POST('/admin/slot-watches/{watchID}/cancel', {
      params: { path: { watchID: watchId } },
    }),
  );
  queryClient.setQueriesData<SlotWatch[]>({ queryKey: slotWatchKeys.lists() }, (current) =>
    current?.filter((watch) => watch.id !== watchId),
  );
}
