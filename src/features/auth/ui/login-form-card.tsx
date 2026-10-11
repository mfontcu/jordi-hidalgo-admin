import { useId } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button, Card, FieldError, Input, Label } from '@/shared/ui';

import type { useLoginForm } from '../hooks/use-login-form';

type LoginFormCardProps = {
  form: ReturnType<typeof useLoginForm>;
};

/** login_form_card.dart: title, error banner, email and password fields, and the submit button. */
export function LoginFormCard({ form }: LoginFormCardProps) {
  const intl = useIntl();
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const { emailErrorKey, passwordErrorKey, passwordVisible } = form;

  return (
    <Card className="p-6">
      <form noValidate onSubmit={(event) => void form.submit(event)}>
        <p className="font-bold text-content-secondary">
          <FormattedMessage id="authLoginSectionLabel" />
        </p>
        <h1 className="mt-2 text-login-title font-black text-on-surface">
          <FormattedMessage id="authLoginTitle" />
        </h1>

        {form.errorKey && (
          <p role="alert" className="mt-4 w-full rounded-md bg-danger-bg p-3 font-semibold text-danger-fg">
            <FormattedMessage id={form.errorKey} />
          </p>
        )}

        <Label htmlFor={emailId} className="mt-6">
          <FormattedMessage id="authEmailLabel" />
        </Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          inputMode="email"
          className="mt-2"
          placeholder={intl.formatMessage({ id: 'authEmailHint' })}
          aria-invalid={emailErrorKey ? true : undefined}
          aria-describedby={emailErrorKey ? `${emailId}-error` : undefined}
          disabled={form.isSubmitting}
          {...form.register('email')}
        />
        {emailErrorKey && (
          <FieldError id={`${emailId}-error`}>
            <FormattedMessage id={emailErrorKey} />
          </FieldError>
        )}

        <Label htmlFor={passwordId} className="mt-4">
          <FormattedMessage id="authPasswordLabel" />
        </Label>
        <div className="relative mt-2">
          <Input
            id={passwordId}
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            className="pr-14"
            placeholder="••••••••"
            aria-invalid={passwordErrorKey ? true : undefined}
            aria-describedby={passwordErrorKey ? `${passwordId}-error` : undefined}
            disabled={form.isSubmitting}
            {...form.register('password')}
          />
          <Button
            variant="icon"
            icon={passwordVisible ? 'visibility_outlined' : 'visibility_off_outlined'}
            className="absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={intl.formatMessage({ id: passwordVisible ? 'authHidePassword' : 'authShowPassword' })}
            aria-pressed={passwordVisible}
            aria-controls={passwordId}
            onClick={form.togglePasswordVisible}
          />
        </div>
        {passwordErrorKey && (
          <FieldError id={`${passwordId}-error`}>
            <FormattedMessage id={passwordErrorKey} />
          </FieldError>
        )}

        <Button type="submit" className="mt-6 w-full" loading={form.isSubmitting}>
          {/* While signing in, the Flutter button shows only the spinner. */}
          <span className={form.isSubmitting ? 'sr-only' : undefined}>
            <FormattedMessage id="authSubmitButton" />
          </span>
        </Button>

        <p className="mt-3 text-center text-login-caption text-content-muted">
          <FormattedMessage id="authRestrictedAccess" />
        </p>
      </form>
    </Card>
  );
}
