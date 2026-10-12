import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useGoBack } from '@/shared/lib/use-go-back';

import { countPhoneMatches, createUser, updateUser } from '../api/users.mutations';
import { userDetailQueryOptions } from '../api/users.queries';
import type { AdminUser } from '../model/admin-user';
import { displayNameOf } from '../model/client';
import {
  clientCreateInput,
  clientFormDefaults,
  clientFormSchema,
  clientPhoneOf,
  clientUpdateInput,
  isProfileLocked,
  needsDuplicatePhoneCheck,
  type ClientFormErrorKey,
  type ClientFormInput,
} from '../model/client-form';

/**
 * What the form screen needs before it can show the form: to edit, the account
 * (`/clients/{id}/form`); and where it was opened from (`backLabel`, the appointment form).
 */
export function useClientFormData() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const clientId = params.clientId ?? null;
  const query = useQuery({ ...userDetailQueryOptions(clientId ?? ''), enabled: clientId !== null });
  const fromAppointment = search.returnTo === 'appointmentForm';

  return {
    isEdit: clientId !== null,
    user: clientId === null ? null : query.data,
    isLoading: clientId !== null && query.isPending,
    error: clientId !== null && query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    /** The back button's label when another screen opened the form; null for the list's. */
    backLabel: search.backLabel ?? null,
    fromAppointment,
    goBack: useGoBack(fromAppointment ? '/appointments/form' : '/clients'),
  };
}

type FormOptions = {
  /** The account to edit; null for a new one. */
  user: AdminUser | null;
  onSaved: (user: AdminUser, isEdit: boolean) => void;
  onError: (error: unknown) => void;
};

/**
 * The client form (ClientFormScreen): validation on submit, the duplicate-phone question, and the
 * save. A new client opens its detail, or goes back to the appointment form that opened the form
 * with the client chosen; an edited one goes back to the detail it came from.
 */
export function useClientForm({ user, onSaved, onError }: FormOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ strict: false });
  const locked = isProfileLocked(user);

  const form = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema(locked)),
    defaultValues: clientFormDefaults(user),
    // Flutter validates the form on submit only.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const save = useMutation({
    mutationFn: (values: ClientFormInput) =>
      user
        ? updateUser(queryClient, user.id, clientUpdateInput(user, values))
        : createUser(queryClient, clientCreateInput(values)),
    onSuccess: (saved) => {
      onSaved(saved, user !== null);
      if (!user && search.returnTo === 'appointmentForm') {
        // The appointment form takes the new client from its prefill (phase 8).
        void navigate({
          to: '/appointments/form',
          search: {
            ...search.appointment,
            clientId: saved.id,
            clientLabel: displayNameOf(saved) || undefined,
          },
          replace: true,
          ignoreBlocker: true,
        });
        return;
      }
      if (user && router.history.canGoBack()) {
        router.history.back({ ignoreBlocker: true });
        return;
      }
      void navigate({
        to: '/clients/$clientId',
        params: { clientId: saved.id },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError,
  });

  // An editable phone that changed is checked first; other clients with it ask before saving.
  const [duplicateOf, setDuplicateOf] = useState<ClientFormInput | null>(null);
  const phoneCheck = useMutation({
    mutationFn: (values: ClientFormInput) => countPhoneMatches(clientPhoneOf(values, user), user?.id ?? null),
    onSuccess: (count, values) => {
      if (count > 0) setDuplicateOf(values);
      else save.mutate(values);
    },
    onError,
  });

  const { errors, isDirty } = form.formState;
  return {
    form,
    locked,
    errorKey: (field: keyof ClientFormInput) => errors[field]?.message as ClientFormErrorKey | undefined,
    submit: form.handleSubmit((values) => {
      if (needsDuplicatePhoneCheck(values, user)) phoneCheck.mutate(values);
      else save.mutate(values);
    }),
    /** Other clients have the phone: saving needs a yes. */
    duplicatePhone: duplicateOf !== null,
    confirmDuplicate: () => {
      if (duplicateOf) save.mutate(duplicateOf);
      setDuplicateOf(null);
    },
    dismissDuplicate: () => {
      setDuplicateOf(null);
    },
    isChecking: phoneCheck.isPending,
    isSaving: save.isPending,
    /** Leaving asks first while there are changes, and not once the client is saved. */
    hasUnsavedChanges: isDirty && !save.isPending && !save.isSuccess,
  };
}
