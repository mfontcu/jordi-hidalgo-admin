import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { activityKeys } from '../api/activity.keys';
import {
  activityConnection,
  activityStreamCursor,
  hasActivitySession,
  rememberActivityCursor,
  type ActivityStreamEvent,
} from '../api/activity-connection';
import { appendRecentActivity } from '../api/activity.queries';
import { queryKeysForKind, queryKeysForReset, type ActivityItem } from '../model/refresh';

const RETRY_MAX_MS = 15_000;

/**
 * One activity stream for this tab. The shell mounts it after the session is restored.
 * Every event refreshes the screens it touches. A live announced event, while the tab is visible
 * and not part of the reconnect burst, is handed to `onToast`. The toast does not mark it read.
 */
export function useActivityStream(onToast: (item: ActivityItem) => void) {
  const queryClient = useQueryClient();
  const onToastRef = useRef(onToast);

  useEffect(() => {
    onToastRef.current = onToast;
  });

  useEffect(() => {
    if (!hasActivitySession()) return undefined;
    const connection = activityConnection();
    const abort = new AbortController();
    const gate = { stopped: false };

    const onEvent = (event: ActivityStreamEvent) => {
      if (event.type === 'live') {
        void queryClient.invalidateQueries({ queryKey: activityKeys.recent() });
        return;
      }
      if (event.type === 'reset') {
        rememberActivityCursor(event.id);
        invalidate(queryClient, queryKeysForReset());
        return;
      }
      const item: ActivityItem = { ...event.row, read: false };
      rememberActivityCursor(item.id);
      invalidate(queryClient, queryKeysForKind(item.kind, item.payload));
      if (!item.announce || event.replay) return;
      appendRecentActivity(queryClient, item);
      if (document.visibilityState === 'visible') onToastRef.current(item);
    };

    const shouldStop = () => gate.stopped || isAborted(abort.signal) || !hasActivitySession();

    const loop = async () => {
      let delayMs = 1000;
      while (!shouldStop()) {
        try {
          await connection.open({ after: activityStreamCursor(), signal: abort.signal, onEvent });
        } catch {
          // The server dropped the stream. Reopen unless the shell is gone.
        }
        if (shouldStop()) return;
        if (document.visibilityState !== 'visible') {
          await waitUntilVisible(abort.signal);
          delayMs = 1000;
          continue;
        }
        await wait(delayMs, abort.signal);
        delayMs = Math.min(delayMs * 2, RETRY_MAX_MS);
      }
    };

    void loop();
    return () => {
      gate.stopped = true;
      abort.abort();
    };
  }, [queryClient]);
}

function isAborted(signal: AbortSignal) {
  return signal.aborted;
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, keys: readonly (readonly unknown[])[]) {
  for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey });
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function waitUntilVisible(signal: AbortSignal) {
  if (typeof document === 'undefined' || document.visibilityState === 'visible' || signal.aborted) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      document.removeEventListener('visibilitychange', onVisible);
      resolve();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') finish();
    };
    signal.addEventListener('abort', finish, { once: true });
    document.addEventListener('visibilitychange', onVisible);
  });
}
