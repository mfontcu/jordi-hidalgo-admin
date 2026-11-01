/**
 * Every API failure becomes one `ApiError` (ADR-003, "HTTP client and errors"). It carries the HTTP
 * status, the backend's message, and its stable `code` when the backend sends one (CA-04); `server`
 * keeps its status, so a 503 can have its own copy. `network` covers transport failures and
 * timeouts, which have neither.
 */
export type ApiError =
  | { kind: 'network' }
  | {
      kind: 'unauthorized' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'rateLimited' | 'server';
      status: number;
      message: string;
      code?: string;
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

/**
 * The backend answers errors with `http.Error`: plain text. A JSON `message`, or the `detail` of a
 * problem (RFC 9457, BE-32), is accepted too.
 */
export function errorMessageFromBody(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (body && typeof body === 'object') {
    if ('message' in body && typeof body.message === 'string') return body.message.trim();
    if ('detail' in body && typeof body.detail === 'string') return body.detail.trim();
  }
  return '';
}

/**
 * The backend's stable error code (CA-04): the `Error-Code` header, or the `code` of an
 * application/problem+json body. Undefined from a backend without codes.
 */
export function errorCodeFromResponse(headers: Headers, body: unknown): string | undefined {
  const header = headers.get('Error-Code')?.trim();
  if (header) return header;
  const problem = headers.get('Content-Type')?.toLowerCase().startsWith('application/problem+json');
  if (problem && body && typeof body === 'object' && 'code' in body && typeof body.code === 'string') {
    return body.code.trim() || undefined;
  }
  return undefined;
}

export function apiErrorFromResponse(status: number, body: unknown, headers?: Headers): ApiError {
  const error: ApiError = { kind: kindForStatus(status), status, message: errorMessageFromBody(body) };
  const code = headers ? errorCodeFromResponse(headers, body) : undefined;
  return code ? { ...error, code } : error;
}

/**
 * A 403 on `/admin/*` that means the caller lost panel access: blocked (`user_blocked`) or no longer
 * an admin (`forbidden`). Without a code, by the text, until BE-32.
 */
export function isAdminAccessLost(code: string | undefined, message: string): boolean {
  if (code) return code === 'user_blocked' || code === 'forbidden';
  return isAdminAccessLostMessage(message);
}

/** `isAdminAccessLost` for a 403 response, read from a clone so the caller can still read the body. */
export async function isAdminAccessLostResponse(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;
  const text = await response.clone().text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Plain text, as http.Error answers.
  }
  return isAdminAccessLost(errorCodeFromResponse(response.headers, body), errorMessageFromBody(body));
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
  if (!response.ok) throw new ApiException(apiErrorFromResponse(response.status, error, response.headers));
  return data as T;
}
