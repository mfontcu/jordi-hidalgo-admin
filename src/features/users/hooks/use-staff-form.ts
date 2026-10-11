import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { useGoBack } from '@/shared/lib/use-go-back';

import { createUser, updateUser } from '../api/users.mutations';
import { userDetailQueryOptions } from '../api/users.queries';
import type { AdminUser } from '../model/admin-user';
import {
  staffCreateInput,
  staffCreateSchema,
  staffEditSchema,
  staffFormDefaults,
  staffUpdateInput,
  type StaffFormErrorKey,
  type StaffFormInput,
} from '../model/staff-form';

/** What the form screen needs before it can show the form: to edit, the account (`/admins/{id}/form`). */
export function useStaffFormData() {
  const params = useParams({ strict: false });
  const staffId = params.staffId ?? null;
  const query = useQuery({ ...userDetailQueryOptions(staffId ?? ''), enabled: staffId !== null });

  return {
    isEdit: staffId !== null,
    user: staffId === null ? null : query.data,
    isLoading: staffId !== null && query.isPending,
    error: staffId !== null && query.isError ? query.error : null,
    retry: () => {
      void query.refetch();
    },
    goBack: useGoBack('/admins'),
  };
}

type FormOptions = {
  /** The account to edit; null for a new one. */
  user: AdminUser | null;
  onSaved: (user: AdminUser, isEdit: boolean) => void;
  onError: (error: unknown) => void;
};

/**
 * The staff form (StaffAdminFormScreen): validation on submit and the save. A new account opens its
 * detail, replacing the form in the history; an edited one goes back to the detail it came from.
 */
export function useStaffForm({ user, onSaved, onError }: FormOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const form = useForm<StaffFormInput>({
    resolver: zodResolver(user ? staffEditSchema : staffCreateSchema),
    defaultValues: staffFormDefaults(user),
    // Flutter validates the form on submit only.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: (values: StaffFormInput) =>
      user
        ? updateUser(queryClient, user.id, staffUpdateInput(user, values))
        : createUser(queryClient, staffCreateInput(values)),
    onSuccess: (saved) => {
      onSaved(saved, user !== null);
      if (user && router.history.canGoBack()) {
        router.history.back({ ignoreBlocker: true });
        return;
      }
      void navigate({
        to: '/admins/$staffId',
        params: { staffId: saved.id },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError,
  });

  const { errors, isDirty } = form.formState;
  return {
    form,
    errorKey: (field: keyof StaffFormInput) => errors[field]?.message as StaffFormErrorKey | undefined,
    submit: form.handleSubmit((values) => {
      mutation.mutate(values);
    }),
    isSaving: mutation.isPending,
    /** Leaving asks first while there are changes, and not once the account is saved. */
    hasUnsavedChanges: isDirty && !mutation.isPending && !mutation.isSuccess,
  };
}
