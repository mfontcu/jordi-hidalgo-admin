import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { updateBusinessInfo } from '../api/business.mutations';
import {
  businessInfoFormSchema,
  businessInfoFormValues,
  toBusinessInfoUpdate,
  type BusinessInfo,
  type BusinessInfoFormErrorKey,
  type BusinessInfoFormInput,
} from '../model/business-info';
import { BUSINESS_LOCALES, type BusinessLocale } from '../model/locales';

type Feedback = {
  onSaved: () => void;
  onError: (error: unknown) => void;
};

/**
 * Business info tab: RHF + zod, locale for the translation card, and save. Leaving asks while dirty.
 */
export function useBusinessInfo(info: BusinessInfo, feedback: Feedback) {
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<BusinessLocale>('es');

  const form = useForm<BusinessInfoFormInput>({
    resolver: zodResolver(businessInfoFormSchema),
    defaultValues: businessInfoFormValues(info),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(businessInfoFormValues(info));
  }, [info, form]);

  const mutation = useMutation({
    mutationFn: (input: BusinessInfoFormInput) =>
      updateBusinessInfo(queryClient, info, toBusinessInfoUpdate(input)),
    onSuccess: () => {
      form.reset(form.getValues());
      feedback.onSaved();
    },
    onError: feedback.onError,
  });

  const { errors, isDirty } = form.formState;
  const errorKey = (field: keyof BusinessInfoFormInput) =>
    errors[field]?.message as BusinessInfoFormErrorKey | undefined;

  const isActive = useWatch({ control: form.control, name: 'isActive' });

  return {
    form,
    locale,
    setLocale,
    locales: BUSINESS_LOCALES,
    isActive,
    errorKey,
    submit: form.handleSubmit((input) => {
      mutation.mutate(input);
    }),
    isSaving: mutation.isPending,
    hasUnsavedChanges: isDirty && !mutation.isPending && !mutation.isSuccess,
  };
}
