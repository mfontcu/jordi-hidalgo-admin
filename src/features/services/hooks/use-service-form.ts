import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useGoBack } from '@/shared/lib/use-go-back';

import { createService } from '../api/services.mutations';
import { serviceCategoriesQueryOptions, serviceDetailQueryOptions } from '../api/services.queries';
import { categoryTitle, type Service, type ServiceCategory } from '../model/service';
import {
  serviceFormDefaults,
  serviceFormSchema,
  type CreateServiceInput,
  type ServiceFormErrorKey,
  type ServiceFormInput,
} from '../model/service-form';

/**
 * What the form screen needs before it can show the form: the categories and, for a new version,
 * the base service (`/services/{id}/form`).
 */
export function useServiceFormData() {
  const params = useParams({ strict: false });
  const baseId = params.serviceId ?? null;
  const categories = useQuery(serviceCategoriesQueryOptions());
  const base = useQuery({ ...serviceDetailQueryOptions(baseId ?? ''), enabled: baseId !== null });

  const failed = categories.isError ? categories : baseId !== null && base.isError ? base : null;
  return {
    isNewVersion: baseId !== null,
    categories: categories.data,
    base: baseId === null ? null : base.data,
    isLoading: categories.isPending || (baseId !== null && base.isPending),
    error: failed?.error ?? null,
    retry: () => {
      if (categories.isError) void categories.refetch();
      if (base.isError) void base.refetch();
    },
    goBack: useGoBack('/services'),
  };
}

type FormOptions = {
  base: Service | null;
  categories: readonly ServiceCategory[];
  onSaved: (service: Service, isNewVersion: boolean) => void;
  onError: (error: unknown) => void;
};

/**
 * The service form (ServiceForm): validation on submit, the category lookup, and the save. A
 * saved service opens its detail, replacing the form in the history.
 */
export function useServiceForm({ base, categories, onSaved, onError }: FormOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const form = useForm<ServiceFormInput, unknown, CreateServiceInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: serviceFormDefaults(base, categories),
    // Flutter validates the form on submit only.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: (input: CreateServiceInput) => createService(queryClient, input),
    onSuccess: (service) => {
      onSaved(service, base !== null);
      void navigate({
        to: '/services/$serviceId',
        params: { serviceId: service.id },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError,
  });

  const categoryId = useWatch({ control: form.control, name: 'serviceCategoryId' });
  const category = categories.find((item) => item.id === categoryId);
  const { errors, isDirty } = form.formState;
  const errorKey = (field: keyof ServiceFormInput) =>
    errors[field]?.message as ServiceFormErrorKey | undefined;

  return {
    form,
    errorKey,
    submit: form.handleSubmit((input) => {
      mutation.mutate(input);
    }),
    isSaving: mutation.isPending,
    /** Leaving asks first while there are changes, and not once the service is saved. */
    hasUnsavedChanges: isDirty && !mutation.isPending && !mutation.isSuccess,

    categoryLabel: category ? categoryTitle(category) : '',
    categoryOptions: categories.map((item) => ({
      id: item.id,
      title: categoryTitle(item),
      subtitle: item.code,
    })),
    categoriesOpen,
    setCategoriesOpen: (open: boolean) => {
      // With no categories, the field does not open (`_toggleCategorySelector`).
      setCategoriesOpen(open && categories.length > 0);
    },
    pickCategory: (id: string) => {
      form.setValue('serviceCategoryId', id, { shouldDirty: true });
      setCategoriesOpen(false);
    },
    clearCategory: () => {
      form.setValue('serviceCategoryId', '', { shouldDirty: true });
      setCategoriesOpen(false);
    },
  };
}
