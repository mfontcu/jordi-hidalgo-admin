import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { loginFailureOf, signIn } from '../api/session';
import { loginErrorKey, type LoginErrorKey } from '../model/login-error';
import {
  loginFormSchema,
  type LoginFieldErrorKey,
  type LoginFormInput,
  type LoginFormValues,
} from '../model/login-form';

type UseLoginFormOptions = {
  /** Called once the staff member is signed in, to open the requested path. */
  onSignedIn: () => void;
};

/** Login screen logic: validation, sign-in, the error above the form, and password visibility. */
export function useLoginForm({ onSignedIn }: UseLoginFormOptions) {
  const queryClient = useQueryClient();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const form = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
    // Flutter validates the form on submit only.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => signIn(queryClient, values),
    onSuccess: onSignedIn,
  });

  const submit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  const { errors } = form.formState;
  const errorKey: LoginErrorKey | null = mutation.isError
    ? loginErrorKey(loginFailureOf(mutation.error))
    : null;

  return {
    register: form.register,
    submit,
    // Stays busy after success, until the requested path opens.
    isSubmitting: mutation.isPending || mutation.isSuccess,
    errorKey,
    emailErrorKey: errors.email?.message as LoginFieldErrorKey | undefined,
    passwordErrorKey: errors.password?.message as LoginFieldErrorKey | undefined,
    passwordVisible,
    togglePasswordVisible: () => {
      setPasswordVisible((visible) => !visible);
    },
  };
}
