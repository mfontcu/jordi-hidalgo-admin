import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter, useSearch } from '@tanstack/react-router';

import { useGoBack } from '@/shared/lib/use-go-back';

import { usersKeys } from '../api/users.keys';
import {
  deleteUser,
  sendActivationEmail,
  sendPasswordSetupEmail,
  updateUser,
  verifyAccount,
} from '../api/users.mutations';
import { userDetailQueryOptions } from '../api/users.queries';
import type { AdminUser } from '../model/admin-user';
import { clientBlockInput, displayNameOf } from '../model/client';

type SuccessMessage =
  | 'clientPasswordEmailSent'
  | 'clientActivationEmailSent'
  | 'clientVerifiedSnackbar'
  | 'clientDeletedSnackbar'
  | 'clientBlockedToast'
  | 'clientUnblockedToast';
type FailureContext =
  | 'clientPasswordEmailFailed'
  | 'clientActivationEmailFailed'
  | 'clientVerifyFailed'
  | 'clientBlockFailed'
  | 'clientUnblockFailed'
  | 'clientDeleteFailed';

type Feedback = {
  /** Shows a success toast with this message id. */
  onSuccess: (message: SuccessMessage) => void;
  /** Shows an error toast for `error`, after the message of what failed. */
  onError: (error: unknown, context: FailureContext) => void;
};

/**
 * Client detail (ClientDetailScreen): the account, its actions, and the links to a new appointment
 * and the edit form. Each action waits for the server and confirms with a toast (Flutter confirms
 * neither blocking nor unblocking: approved change); a deleted client goes back to the list.
 */
export function useClientDetail(feedback: Feedback) {
  const { clientId } = useParams({ from: '/_authed/clients/$clientId/' });
  const { backLabel } = useSearch({ from: '/_authed/clients/$clientId/' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const query = useQuery(userDetailQueryOptions(clientId));
  const user = query.data;

  const passwordEmail = useMutation({
    mutationFn: () => sendPasswordSetupEmail(clientId),
    onSuccess: () => {
      feedback.onSuccess('clientPasswordEmailSent');
    },
    onError: (error) => {
      feedback.onError(error, 'clientPasswordEmailFailed');
    },
  });

  const activationEmail = useMutation({
    mutationFn: () => sendActivationEmail(clientId),
    onSuccess: () => {
      feedback.onSuccess('clientActivationEmailSent');
    },
    onError: (error) => {
      feedback.onError(error, 'clientActivationEmailFailed');
    },
  });

  const verification = useMutation({
    mutationFn: () => verifyAccount(queryClient, clientId),
    onSuccess: () => {
      feedback.onSuccess('clientVerifiedSnackbar');
    },
    onError: (error) => {
      feedback.onError(error, 'clientVerifyFailed');
    },
  });

  const block = useMutation({
    mutationFn: ({ stored, reason }: { stored: AdminUser; reason: string | null }) =>
      updateUser(queryClient, clientId, clientBlockInput(stored, reason === null ? null : { reason })),
    onSuccess: (updated) => {
      feedback.onSuccess(updated.isBlocked ? 'clientBlockedToast' : 'clientUnblockedToast');
    },
    onError: (error, { reason }) => {
      feedback.onError(error, reason === null ? 'clientUnblockFailed' : 'clientBlockFailed');
    },
  });

  const removal = useMutation({
    mutationFn: () => deleteUser(queryClient, clientId),
    onSuccess: () => {
      feedback.onSuccess('clientDeletedSnackbar');
      // AdminRouter.popOrNavigate: back to the list it came from, or to the list.
      if (router.history.canGoBack()) router.history.back();
      else void navigate({ to: '/clients', replace: true });
    },
    onError: (error) => {
      feedback.onError(error, 'clientDeleteFailed');
    },
  });

  return {
    user,
    isLoading: query.isPending,
    error: query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    /** The back button's label when another screen opened the detail (`backLabel`). */
    backLabel,
    goBack: useGoBack('/clients'),
    /** After an appointment changes: the counts and dates of the account change too. */
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(clientId), exact: true });
    },
    newAppointment: (stored: AdminUser, back: string) => {
      void navigate({
        to: '/appointments/form',
        search: {
          clientId,
          clientLabel: displayNameOf(stored) || undefined,
          backLabel: back,
          lockInitialUser: true,
        },
      });
    },
    edit: () => {
      void navigate({ to: '/clients/$clientId/form', params: { clientId } });
    },
    sendPasswordEmail: () => {
      if (!passwordEmail.isPending) passwordEmail.mutate();
    },
    isSendingPasswordEmail: passwordEmail.isPending,
    sendActivationEmail: () => {
      if (!activationEmail.isPending) activationEmail.mutate();
    },
    isSendingActivationEmail: activationEmail.isPending,
    verify: () => {
      if (!verification.isPending) verification.mutate();
    },
    isVerifying: verification.isPending,
    /** Blocks with a reason, or unblocks with null. */
    setBlocked: (reason: string | null) => {
      if (user && !block.isPending) block.mutate({ stored: user, reason });
    },
    isChangingBlock: block.isPending,
    remove: () => {
      if (!removal.isPending) removal.mutate();
    },
    isDeleting: removal.isPending,
  };
}
