import { createFileRoute } from '@tanstack/react-router';

import { BlockedSlotFormScreen } from '@/features/schedule';

export const Route = createFileRoute('/_authed/schedule/blocked-slots/form')({
  staticData: { screen: 'blockedSlotForm' },
  component: BlockedSlotFormScreen,
});
