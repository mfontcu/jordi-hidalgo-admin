import { env } from '@/shared/config/env';

import { clearActivityCursor, readActivityCursor, writeActivityCursor } from './activity-cursor';
import { isBlockedUserMessage } from './errors';
import { refreshAccessToken } from './middleware/session';
import { session, useSessionStore } from './session-store';
import { consumeSse, type SseMessage } from './sse';

/** Quiet time after the opening burst before later events count as live. */
const REPLAY_QUIET_MS = 100;

export type ActivityStreamPayload = {
  appointmentPublicId?: string;
  serviceId?: string;
  customerName?: string;
  businessDay?: string;
  previousStart?: string;
  nextStart?: string;
  userId?: string;
  slotWatchId?: string;
  channel?: string;
};

export type ActivityStreamRow = {
  id: number;
  kind: string;
  announce: boolean;
  payload: ActivityStreamPayload;
};

/** What the stream tells the shell. `replay` is the catch-up written as the connection opens. */
export type ActivityStreamEvent =
  | { type: 'activity'; row: ActivityStreamRow; replay: boolean }
  | { type: 'reset'; id: number; replay: boolean }
  | { type: 'live' };

export type ActivityConnection = {
  /**
   * Holds one stream open until the server closes it or `signal` aborts.
   * Resolves when that connection ends. Throws when it dropped and the shell should reopen it.
   */
  open(options: {
    after: number | null;
    signal: AbortSignal;
    onEvent: (event: ActivityStreamEvent) => void;
  }): Promise<void>;
};

type OpenOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

/**
 * `GET /admin/activity/stream` with `fetch`, because `EventSource` cannot send `Authorization`.
 * A 401 refreshes the access token once, through the same refresh the HTTP middleware uses, and
 * opens again. A rejected refresh or a blocked account expires the session and resolves.
 */
export function openActivityStream(
  options: OpenOptions = { baseUrl: env.VITE_API_BASE_URL },
): ActivityConnection {
  // `fetch` has to be called as a method of the window. A bare reference throws
  // "Illegal invocation" and the stream never leaves the tab.
  const fetchImpl: typeof fetch = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  return {
    async open({ after, signal, onEvent }) {
      await connect({
        baseUrl: options.baseUrl,
        fetchImpl,
        after,
        signal,
        onEvent,
        retried: false,
      });
    },
  };
}

/** The connection the shell opens. Tests replace it. */
let connectionOverride: ActivityConnection | null = null;

export function activityConnection(): ActivityConnection {
  return connectionOverride ?? openActivityStream();
}

/** Tests install a fake connection. Pass null to restore the fetch stream. */
export function setActivityConnection(connection: ActivityConnection | null) {
  connectionOverride = connection;
}

/** The cursor the next open should send. */
export function activityStreamCursor(): number | null {
  return readActivityCursor();
}

export function rememberActivityCursor(id: number) {
  writeActivityCursor(id);
}

async function connect(options: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  after: number | null;
  signal: AbortSignal;
  onEvent: (event: ActivityStreamEvent) => void;
  retried: boolean;
}): Promise<void> {
  const token = useSessionStore.getState().accessToken;
  if (!token || isAborted(options.signal)) return;

  const url = new URL('/admin/activity/stream', options.baseUrl);
  if (options.after !== null) url.searchParams.set('after', String(options.after));
  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: 'text/event-stream' });
  if (options.after !== null) headers.set('Last-Event-ID', String(options.after));

  let response: Response;
  try {
    response = await options.fetchImpl(new Request(url, { headers, signal: options.signal }));
  } catch (error) {
    if (isAborted(options.signal)) return;
    throw error;
  }

  if (response.status === 401) {
    if (options.retried) throw new Error('activity stream unauthorized');
    const refreshed = await refreshAccessToken(options.baseUrl, options.fetchImpl);
    if (refreshed !== 'success' || isAborted(options.signal)) return;
    await connect({ ...options, retried: true });
    return;
  }

  if (response.status === 403) {
    const text = await response.text();
    if (isBlockedUserMessage(text)) session.expire();
    return;
  }

  if (response.status === 400 && options.after !== null && !options.retried) {
    clearActivityCursor();
    await connect({ ...options, after: null, retried: true });
    return;
  }

  if (!response.ok || !response.body) throw new Error(`activity stream status ${response.status}`);
  await readActivityEventStream(response.body, options.signal, options.onEvent);
}

/** Reads SSE bytes. Events before a quiet gap are the reconnect burst; later ones are live. */
export async function readActivityEventStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (event: ActivityStreamEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let replay = true;
  const quiet = { id: undefined as ReturnType<typeof setTimeout> | undefined };

  const markLiveSoon = () => {
    clearTimeout(quiet.id);
    quiet.id = setTimeout(() => {
      if (!replay) return;
      replay = false;
      onEvent({ type: 'live' });
    }, REPLAY_QUIET_MS);
  };

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = consumeSse(buffer);
      buffer = parsed.rest;
      for (const message of parsed.messages) {
        const event = eventOf(message, replay);
        if (event) onEvent(event);
      }
      markLiveSoon();
    }
  } finally {
    clearTimeout(quiet.id);
    reader.releaseLock();
  }
}

function isAborted(signal: AbortSignal) {
  return signal.aborted;
}

function eventOf(message: SseMessage, replay: boolean): ActivityStreamEvent | null {
  let parsed: unknown;
  try {
    parsed = message.data === '' ? null : JSON.parse(message.data);
  } catch {
    return null;
  }
  const record = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  const id = numberOf(record?.id) ?? numberOf(message.id);
  if (id === null) return null;

  if (message.event === 'reset') return { type: 'reset', id, replay };
  if (message.event !== 'activity') return null;
  if (!record || typeof record.kind !== 'string') return null;
  return {
    type: 'activity',
    replay,
    row: {
      id,
      kind: record.kind,
      announce: record.announce === true,
      payload: payloadOf(record.payload),
    },
  };
}

function payloadOf(value: unknown): ActivityStreamPayload {
  if (!value || typeof value !== 'object') return {};
  const source = value as Record<string, unknown>;
  const payload: ActivityStreamPayload = {};
  for (const key of [
    'appointmentPublicId',
    'serviceId',
    'customerName',
    'businessDay',
    'previousStart',
    'nextStart',
    'userId',
    'slotWatchId',
    'channel',
  ] as const) {
    if (typeof source[key] === 'string') payload[key] = source[key];
  }
  return payload;
}

function numberOf(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
  }
  return null;
}
