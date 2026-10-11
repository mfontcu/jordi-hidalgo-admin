import { useIntl } from 'react-intl';

import { failureOf, type Failure } from '@/shared/lib/failure';

import type { MessageId } from './messages';

export type FailureMessage = { id: MessageId; values?: Record<string, string> };

/**
 * The message of an error class (cross-cutting row of the migration: network, server, validation,
 * rate limit). The Flutter panel shows the raw exception text instead. A rejected request shows
 * the backend's own text, which names the field it refused; a 503 has its own message.
 */
export function failureMessage(failure: Failure): FailureMessage {
  switch (failure.kind) {
    case 'network':
      return { id: 'adminErrorNetwork' };
    case 'server':
      return { id: failure.status === 503 ? 'adminErrorServiceUnavailable' : 'adminErrorServer' };
    case 'rateLimited':
      return { id: 'adminErrorRateLimited' };
    case 'validation':
      return failure.message
        ? { id: 'adminErrorValidationDetail', values: { detail: failure.message } }
        : { id: 'adminErrorValidation' };
    case 'conflict':
      return { id: 'adminErrorConflict' };
    case 'notFound':
      return { id: 'adminErrorNotFound' };
    case 'forbidden':
      return { id: 'adminErrorForbidden' };
    // A 401 the client could not refresh expires the session; the screen goes away.
    case 'unauthorized':
    case 'unknown':
      return { id: 'adminErrorUnknown' };
  }
}

/**
 * Formats an error for a screen: the class message, after `context` (what failed, such as
 * "Could not delete the service.") when given.
 */
export function useDescribeFailure() {
  const intl = useIntl();
  return (error: unknown, context?: MessageId): string => {
    const { id, values } = failureMessage(failureOf(error));
    const detail = intl.formatMessage({ id }, values);
    return context ? `${intl.formatMessage({ id: context })} ${detail}` : detail;
  };
}
