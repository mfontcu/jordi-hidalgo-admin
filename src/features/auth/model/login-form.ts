import { z } from 'zod';

/** Message ids of the login form's validation errors (login_form_card.dart validators). */
export type LoginFieldErrorKey = 'authEmailRequired' | 'authEmailInvalid' | 'authPasswordRequired';

const error = (key: LoginFieldErrorKey) => ({ error: key });

/** The email is trimmed before it is sent; the password is sent as typed. */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { ...error('authEmailRequired'), abort: true })
    .refine((email) => email.includes('@'), error('authEmailInvalid')),
  password: z.string().refine((password) => password.trim().length > 0, error('authPasswordRequired')),
});

export type LoginFormInput = z.input<typeof loginFormSchema>;
export type LoginFormValues = z.output<typeof loginFormSchema>;
