/**
 * Every API failure becomes one `ApiError` (ADR-003, "HTTP client and errors"). It carries the HTTP
 * status and the backend's plain-text message; `server` keeps its status, so a 503 can have its own
 * copy. `network` covers transport failures and timeouts, which have neither.
 */
export type ApiError =
  | { kind: 'network' }
  | {
      kind: 'unauthorized' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'rateLimited' | 'server';
      status: number;
      message: string;
    };

export type ApiErrorKind = ApiError['kind'];

/** Thrown by the client and by `unwrap`: the `ApiError` travels in `error`. */
export class ApiException extends Error {
  readonly error: ApiError;

  constructor(error: ApiError) {
    super(error.kind === 'network' ? 'network error' : `${error.status} ${error.message}`);
    this.name = 'ApiException';
    this.error = error;
  }
}

export function isApiException(value: unknown): value is ApiException {
  return value instanceof ApiException;
}

function kindForStatus(status: number): Exclude<ApiErrorKind, 'network'> {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'validation';
}

/** The backend answers errors with `http.Error`: plain text. A JSON `message` is accepted too. */
export function errorMessageFromBody(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return body.message.trim();
  }
  return '';
}

export function apiErrorFromResponse(status: number, body: unknown): ApiError {
  return { kind: kindForStatus(status), status, message: errorMessageFromBody(body) };
}

/** Backend message of a 403 whose user was blocked (`domain.ErrUserBlocked`). */
export function isBlockedUserMessage(message: string): boolean {
  return message.toLowerCase().includes('user is blocked');
}

/**
 * Backend message of a 403 on `/admin/*` that means the caller lost panel access: blocked, or no
 * longer an admin (`forbidden`). The backend reads the user on every admin request (BE-04).
 */
export function isAdminAccessLostMessage(message: string): boolean {
  return isBlockedUserMessage(message) || message.trim().toLowerCase() === 'forbidden';
}

type FetchResult<T> = { data?: T; error?: unknown; response: Response };

/**
 * Returns the data of an `openapi-fetch` result, or throws its failure as an `ApiException`.
 * Feature `api` modules call it on every request.
 */
export function unwrap<T>({ data, error, response }: FetchResult<T>): T {
  if (!response.ok) throw new ApiException(apiErrorFromResponse(response.status, error));
  return data as T;
}
