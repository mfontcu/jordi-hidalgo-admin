import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';

import { useGoBack } from '@/shared/lib/use-go-back';

import { deleteBlockedSlot } from '../api/schedule.mutations';
import { blockedSlotDetailQueryOptions } from '../api/schedule.queries';

type Feedback = { onError: (error: unknown, context: 'scheduleBlockedSlotDeleteError') => void };

/** Blocked-slot detail (BlockedSlotDetailScreen): the block, edit, and delete with a confirmation. */
export function useBlockedSlotDetail(feedback: Feedback) {
  const { blockedSlotId } = useParams({ from: '/_authed/schedule/blocked-slots/$blockedSlotId/' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery(blockedSlotDetailQueryOptions(blockedSlotId));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const removal = useMutation({
    mutationFn: () => deleteBlockedSlot(queryClient, blockedSlotId),
    // Flutter goes back to the list with no message.
    onSuccess: () => navigate({ to: '/schedule/blocked-slots', replace: true }),
    onError: (error) => {
      feedback.onError(error, 'scheduleBlockedSlotDeleteError');
    },
  });

  return {
    slot: query.data,
    isLoading: query.isPending,
    error: query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    goBack: useGoBack('/schedule/blocked-slots'),
    edit: () => {
      void navigate({ to: '/schedule/blocked-slots/$blockedSlotId/form', params: { blockedSlotId } });
    },
    confirmingDelete,
    setConfirmingDelete,
    remove: () => {
      removal.mutate();
    },
    isRemoving: removal.isPending,
  };
}
