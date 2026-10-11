import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';

import { useGoBack } from '@/shared/lib/use-go-back';

import {
  deleteService,
  setServiceActive,
  updateDisplayOrder,
  updateShowOnPublicSite,
} from '../api/services.mutations';
import { serviceDetailQueryOptions } from '../api/services.queries';
import { parseDisplayOrder } from '../model/service-form';

type Feedback = {
  /** Shows a success toast with this message id. */
  onSuccess: (message: 'servicePriorityUpdated') => void;
  /** Shows an error toast for `error`, after the message of what failed. */
  onError: (
    error: unknown,
    context:
      | 'serviceActivateFailed'
      | 'serviceDeactivateFailed'
      | 'serviceDeleteFailed'
      | 'servicePriorityUpdateFailed'
      | 'serviceWebVisibilityUpdateFailed',
  ) => void;
};

/**
 * Service detail (ServiceDetailScreen): the service, and its actions. Activating, deactivating, and
 * deleting wait for the server; the web switch flips at once and goes back if the server refuses.
 */
export function useServiceDetail(feedback: Feedback) {
  const { serviceId } = useParams({ from: '/_authed/services/$serviceId/' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery(serviceDetailQueryOptions(serviceId));
  const service = query.data;

  const activation = useMutation({
    mutationFn: (active: boolean) => setServiceActive(queryClient, serviceId, active),
    onError: (error, active) => {
      feedback.onError(error, active ? 'serviceActivateFailed' : 'serviceDeactivateFailed');
    },
  });

  const removal = useMutation({
    mutationFn: () => deleteService(queryClient, serviceId),
    // Flutter goes back to the list with no message.
    onSuccess: () => navigate({ to: '/services', replace: true }),
    onError: (error) => {
      feedback.onError(error, 'serviceDeleteFailed');
    },
  });

  const webVisibility = useMutation({
    mutationFn: (show: boolean) => updateShowOnPublicSite(queryClient, serviceId, show),
    onError: (error) => {
      feedback.onError(error, 'serviceWebVisibilityUpdateFailed');
    },
  });

  return {
    service,
    isLoading: query.isPending,
    error: query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    goBack: useGoBack('/services'),
    createVersion: () => {
      void navigate({ to: '/services/$serviceId/form', params: { serviceId } });
    },
    setActive: (active: boolean) => {
      activation.mutate(active);
    },
    isChangingActive: activation.isPending,
    remove: () => {
      removal.mutate();
    },
    isRemoving: removal.isPending,

    /** The switch shows the requested value while the request runs, then the server's. */
    showOnPublicSite: webVisibility.isPending
      ? webVisibility.variables
      : (service?.showOnPublicSite ?? false),
    isUpdatingWebVisibility: webVisibility.isPending,
    setShowOnPublicSite: (show: boolean) => {
      if (!webVisibility.isPending) webVisibility.mutate(show);
    },

    displayOrder: useDisplayOrderEditor(serviceId, service?.displayOrder ?? 0, feedback),
  };
}

/**
 * `_DisplayOrderEditor`: a number field and a save button. An invalid number is reported under
 * the field (Flutter shows a toast); a failed save puts the stored value back.
 */
function useDisplayOrderEditor(serviceId: string, stored: number, feedback: Feedback) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(String(stored));
  const [invalid, setInvalid] = useState(false);
  const [syncedValue, setSyncedValue] = useState(stored);

  const mutation = useMutation({
    mutationFn: (displayOrder: number) => updateDisplayOrder(queryClient, serviceId, displayOrder),
    onSuccess: () => {
      feedback.onSuccess('servicePriorityUpdated');
    },
    onError: (error) => {
      setText(String(stored));
      feedback.onError(error, 'servicePriorityUpdateFailed');
    },
  });

  // A new stored value (saved here or elsewhere) replaces the text, unless a save is running.
  if (stored !== syncedValue && !mutation.isPending) {
    setSyncedValue(stored);
    setText(String(stored));
  }

  return {
    text,
    setText: (value: string) => {
      setText(value);
      setInvalid(false);
    },
    invalid,
    isSaving: mutation.isPending,
    save: () => {
      if (mutation.isPending) return;
      const parsed = parseDisplayOrder(text);
      if (parsed === null) {
        setInvalid(true);
        return;
      }
      if (parsed === stored) return;
      mutation.mutate(parsed);
    },
  };
}
