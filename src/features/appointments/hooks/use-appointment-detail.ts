import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';

import { failureOf } from '@/shared/lib/failure';
import { useGoBack } from '@/shared/lib/use-go-back';

import { cancelAppointment, changeAppointmentStatus, sendCustomerPush } from '../api/appointments.mutations';
import {
  appointmentDetailQueryOptions,
  customerPushMessagesQueryOptions,
  formClientQueryOptions,
  rescheduleChainQueryOptions,
} from '../api/appointments.queries';
import {
  canReschedule,
  canSendCustomerPush,
  isCorrectableStatus,
  isFinalStatus,
  pushBodyOf,
  showsRescheduleChain,
  statusTargetsOf,
  SlotTakenError,
  type AppointmentDetail,
  type SlotConflict,
} from '../model/appointment';

type SuccessMessage =
  | 'appointmentCompletedSnackbar'
  | 'appointmentNoShowSnackbar'
  | 'appointmentCancelledSnackbar'
  | 'appointmentStatusUpdatedSnackbar'
  | 'customerPushSentSnackbar';
type FailureContext =
  | 'appointmentCompleteFailed'
  | 'appointmentStatusUpdateFailed'
  | 'appointmentCancelFailed'
  | 'customerPushFailed';
type TooEarlyMessage = 'appointmentStatusChangeBeforeStartError';
type PushSpecial = 'customerPushNoTokens' | 'customerPushRateLimit' | 'customerPushUnavailable';

type Options = {
  onSuccess: (message: SuccessMessage) => void;
  onError: (error: unknown, context: FailureContext) => void;
  onTooEarly: (message: TooEarlyMessage) => void;
  onPushSpecial: (message: PushSpecial, phone: string) => void;
  /** A cancelled appointment could not go back to `target`: `conflict` takes its slot. */
  onSlotTaken: (
    appointment: AppointmentDetail,
    conflict: SlotConflict,
    target: 'pending' | 'confirmed',
  ) => void;
};

type StatusTarget = 'completed' | 'no_show' | 'pending' | 'confirmed';

/**
 * Appointment detail: status actions, cancel, reschedule entry, push composer and history, and the
 * reschedule chain when the appointment was moved before.
 */
export function useAppointmentDetail({
  onSuccess,
  onError,
  onTooEarly,
  onPushSpecial,
  onSlotTaken,
}: Options) {
  const { appointmentId } = useParams({ from: '/_authed/appointments/$appointmentId/' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const goBack = useGoBack('/appointments');

  const detail = useQuery(appointmentDetailQueryOptions(appointmentId));
  const appointment = detail.data;
  const userId = appointment?.userId ?? '';

  const push = useQuery({
    ...customerPushMessagesQueryOptions(appointmentId),
    enabled: canSendCustomerPush(userId),
  });
  const chain = useQuery({
    ...rescheduleChainQueryOptions(appointmentId),
    enabled: showsRescheduleChain(appointment?.rescheduleChainLength ?? 0),
  });
  const client = useQuery(formClientQueryOptions(userId));

  const statusChange = useMutation({
    mutationFn: ({ item, status }: { item: AppointmentDetail; status: StatusTarget }) =>
      changeAppointmentStatus(queryClient, item, status),
    onSuccess: (_, { status }) => {
      if (status === 'completed') onSuccess('appointmentCompletedSnackbar');
      else if (status === 'no_show') onSuccess('appointmentNoShowSnackbar');
      else onSuccess('appointmentStatusUpdatedSnackbar');
    },
    onError: (error, { item, status }) => {
      if (error instanceof SlotTakenError && (status === 'pending' || status === 'confirmed')) {
        onSlotTaken(item, error.conflict, status);
        return;
      }
      onError(error, status === 'completed' ? 'appointmentCompleteFailed' : 'appointmentStatusUpdateFailed');
    },
  });

  const cancellation = useMutation({
    mutationFn: (item: AppointmentDetail) => cancelAppointment(queryClient, item),
    onSuccess: () => {
      onSuccess('appointmentCancelledSnackbar');
    },
    onError: (error) => {
      onError(error, 'appointmentCancelFailed');
    },
  });

  const pushSend = useMutation({
    mutationFn: (body: string) => sendCustomerPush(queryClient, appointmentId, body),
    onSuccess: () => {
      onSuccess('customerPushSentSnackbar');
    },
    onError: (error) => {
      const failure = failureOf(error);
      if (failure.kind === 'validation') {
        onPushSpecial('customerPushNoTokens', appointment?.user?.phone ?? client.data?.phone ?? '');
        return;
      }
      if (failure.kind === 'rateLimited') {
        onPushSpecial('customerPushRateLimit', '');
        return;
      }
      if (failure.kind === 'server' && failure.status === 503) {
        onPushSpecial('customerPushUnavailable', '');
        return;
      }
      onError(error, 'customerPushFailed');
    },
  });

  const applyStatus = (status: StatusTarget) => {
    if (!appointment) return;
    if ((status === 'completed' || status === 'no_show') && !statusTargetsOf(appointment).includes(status)) {
      onTooEarly('appointmentStatusChangeBeforeStartError');
      return;
    }
    statusChange.mutate({ item: appointment, status });
  };

  return {
    appointmentId,
    appointment,
    isLoading: detail.isPending,
    error: detail.isError ? detail.error : null,
    retry: () => {
      void detail.refetch();
    },
    goBack,
    isFinal: appointment ? isFinalStatus(appointment.status) : true,
    canCorrectStatus: appointment ? isCorrectableStatus(appointment.status) : false,
    statusTargets: appointment ? statusTargetsOf(appointment) : [],
    canReschedule: canReschedule(userId),
    canPush: canSendCustomerPush(userId),
    client,
    pushMessages: push.data ?? [],
    pushLoading: push.isPending,
    pushError: push.isError ? push.error : null,
    retryPush: () => {
      void push.refetch();
    },
    chain: chain.data ?? [],
    showChain: showsRescheduleChain(appointment?.rescheduleChainLength ?? 0),
    openClient: () => {
      if (!userId) return;
      void navigate({ to: '/clients/$clientId', params: { clientId: userId } });
    },
    openReschedule: () => {
      void navigate({
        to: '/appointments/$appointmentId/reschedule',
        params: { appointmentId },
      });
    },
    complete: () => {
      applyStatus('completed');
    },
    markNoShow: () => {
      applyStatus('no_show');
    },
    setPending: () => {
      applyStatus('pending');
    },
    setConfirmed: () => {
      applyStatus('confirmed');
    },
    cancel: () => {
      if (appointment) cancellation.mutate(appointment);
    },
    sendPush: (text: string) => {
      const body = pushBodyOf(text);
      if (!body || !canSendCustomerPush(userId)) return;
      pushSend.mutate(body);
    },
    isBusy: statusChange.isPending || cancellation.isPending || pushSend.isPending,
    isPushing: pushSend.isPending,
  };
}
