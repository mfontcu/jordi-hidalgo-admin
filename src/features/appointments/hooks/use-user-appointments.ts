import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { cancelAppointment, changeAppointmentStatus } from '../api/appointments.mutations';
import { userAppointmentsQueryOptions } from '../api/appointments.queries';
import { APPOINTMENTS_PAGE_SIZE, rowActionsOf, type AppointmentItem } from '../model/appointment';

type SuccessMessage =
  'appointmentCompletedSnackbar' | 'appointmentNoShowSnackbar' | 'appointmentCancelledSnackbar';
type FailureContext =
  'appointmentCompleteFailed' | 'appointmentStatusUpdateFailed' | 'appointmentCancelFailed';
type TooEarlyMessage = 'appointmentBulkCompleteBeforeStartError' | 'appointmentStatusChangeBeforeStartError';

type Options = {
  userId: string;
  /** After a change: the account's counts (appointments, no-shows) change too. */
  onChanged: () => void;
  onSuccess: (message: SuccessMessage) => void;
  onError: (error: unknown, context: FailureContext) => void;
  /** The appointment has not started yet: it can be neither completed nor a no-show. */
  onTooEarly: (message: TooEarlyMessage) => void;
};

type StatusChange = { item: AppointmentItem; status: 'completed' | 'no_show' };

/**
 * The appointments of an account in its detail (client and staff details): every status, ten per
 * page, with complete, no-show, and cancel on each open row. The page stays in the section, as in
 * Flutter, not in the URL of the detail.
 */
export function useUserAppointments({ userId, onChanged, onSuccess, onError, onTooEarly }: Options) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const list = useQuery({
    ...userAppointmentsQueryOptions({ userId, page, pageSize: APPOINTMENTS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const statusChange = useMutation({
    mutationFn: ({ item, status }: StatusChange) => changeAppointmentStatus(queryClient, item, status),
    onSuccess: (_, { status }) => {
      onChanged();
      onSuccess(status === 'completed' ? 'appointmentCompletedSnackbar' : 'appointmentNoShowSnackbar');
    },
    onError: (error, { status }) => {
      onError(error, status === 'completed' ? 'appointmentCompleteFailed' : 'appointmentStatusUpdateFailed');
    },
  });

  const cancellation = useMutation({
    mutationFn: (item: AppointmentItem) => cancelAppointment(queryClient, item),
    onSuccess: () => {
      onChanged();
      onSuccess('appointmentCancelledSnackbar');
    },
    onError: (error) => {
      onError(error, 'appointmentCancelFailed');
    },
  });

  const changeStatus = (item: AppointmentItem, status: 'completed' | 'no_show') => {
    // The actions show only once it has started; the time may have changed since the page drew.
    if (!rowActionsOf(item).completeOrNoShow) {
      onTooEarly(
        status === 'completed'
          ? 'appointmentBulkCompleteBeforeStartError'
          : 'appointmentStatusChangeBeforeStartError',
      );
      return;
    }
    statusChange.mutate({ item, status });
  };

  return {
    page: list.data,
    isLoading: list.isPending,
    isRefreshing: list.isFetching && list.isPlaceholderData,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },
    goToPage: setPage,
    open: (appointmentId: string) => {
      void navigate({ to: '/appointments/$appointmentId', params: { appointmentId } });
    },
    complete: (item: AppointmentItem) => {
      changeStatus(item, 'completed');
    },
    markNoShow: (item: AppointmentItem) => {
      changeStatus(item, 'no_show');
    },
    cancel: (item: AppointmentItem) => {
      cancellation.mutate(item);
    },
    isBusy: statusChange.isPending || cancellation.isPending,
  };
}
