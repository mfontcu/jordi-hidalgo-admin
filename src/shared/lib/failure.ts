/**
 * What went wrong, by error class (ADR-003, "HTTP client and errors"), as screens present it.
 * `shared/api` throws an `ApiException` carrying an `ApiError`; hooks and ui may not import
 * `shared/api`, so this module reads that error by its shape. Anything else is `unknown`.
 */

export const API_ERROR_KINDS = [
  'network',
  'unauthorized',
  'forbidden',
  'notFound',
  'validation',
  'conflict',
  'rateLimited',
  'server',
] as const;

export type FailureKind = (typeof API_ERROR_KINDS)[number] | 'unknown';

/** `status` and `message` (the backend's plain text) are missing for network and unknown errors. */
export type Failure = { kind: FailureKind; status?: number; message: string };

const UNKNOWN: Failure = { kind: 'unknown', message: '' };

function isApiErrorKind(value: unknown): value is (typeof API_ERROR_KINDS)[number] {
  return typeof value === 'string' && (API_ERROR_KINDS as readonly string[]).includes(value);
}

export function failureOf(error: unknown): Failure {
  if (!(error instanceof Error) || !('error' in error)) return UNKNOWN;
  const apiError: unknown = error.error;
  if (!apiError || typeof apiError !== 'object' || !('kind' in apiError) || !isApiErrorKind(apiError.kind)) {
    return UNKNOWN;
  }
  const status = 'status' in apiError && typeof apiError.status === 'number' ? apiError.status : undefined;
  const message = 'message' in apiError && typeof apiError.message === 'string' ? apiError.message : '';
  return status === undefined ? { kind: apiError.kind, message } : { kind: apiError.kind, status, message };
}
