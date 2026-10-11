import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';

import { useGoBack } from '@/shared/lib/use-go-back';

import { sendPasswordSetupEmail, updateUser } from '../api/users.mutations';
import { userDetailQueryOptions } from '../api/users.queries';
import { staffUpdateInput } from '../model/staff-form';

type Feedback = {
  /** Shows a success toast with this message id. */
  onSuccess: (message: 'staffActivatedToast' | 'staffDeactivatedToast' | 'clientPasswordEmailSent') => void;
  /** Shows an error toast for `error`, after the message of what failed. */
  onError: (error: unknown, context: 'staffStatusUpdateFailed' | 'clientPasswordEmailFailed') => void;
};

/**
 * Staff detail (StaffAdminDetailScreen): the account and its actions. Activating, deactivating,
 * and the password email wait for the server and confirm with a toast.
 */
export function useStaffDetail(feedback: Feedback) {
  const { staffId } = useParams({ from: '/_authed/admins/$staffId/' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery(userDetailQueryOptions(staffId));
  const user = query.data;

  const activation = useMutation({
    mutationFn: (active: boolean) => {
      if (!user) throw new Error('No account to update');
      return updateUser(
        queryClient,
        staffId,
        staffUpdateInput(user, { isActive: active, internalNotes: user.internalNotes }),
      );
    },
    // Flutter confirms neither; the panel names the new state (approved improvement).
    onSuccess: (updated) => {
      feedback.onSuccess(updated.isActive ? 'staffActivatedToast' : 'staffDeactivatedToast');
    },
    // Flutter reports a failure with the appointment status message; the panel names the account.
    onError: (error) => {
      feedback.onError(error, 'staffStatusUpdateFailed');
    },
  });

  const passwordEmail = useMutation({
    mutationFn: () => sendPasswordSetupEmail(staffId),
    onSuccess: () => {
      feedback.onSuccess('clientPasswordEmailSent');
    },
    onError: (error) => {
      feedback.onError(error, 'clientPasswordEmailFailed');
    },
  });

  return {
    user,
    isLoading: query.isPending,
    error: query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    goBack: useGoBack('/admins'),
    edit: () => {
      void navigate({ to: '/admins/$staffId/form', params: { staffId } });
    },
    setActive: (active: boolean) => {
      if (!activation.isPending) activation.mutate(active);
    },
    isChangingActive: activation.isPending,
    sendPasswordEmail: () => {
      if (!passwordEmail.isPending) passwordEmail.mutate();
    },
    isSendingPasswordEmail: passwordEmail.isPending,
  };
}
