import { create } from 'zustand';

import { clearActivityCursor } from './activity-cursor';

// ADR-003, "Session storage": raw tokens under these keys, as the Flutter panel kept them.
export const ACCESS_TOKEN_KEY = 'hj_admin.access_token';
export const REFRESH_TOKEN_KEY = 'hj_admin.refresh_token';

export type SessionTokens = { accessToken: string; refreshToken: string };

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  /**
   * Set when the session expired, until the login screen shows its notice once
   * (`sessionExpiredMessageNotifier` in the Flutter panel). Kept in memory only.
   */
  expired: boolean;
};

function readToken(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    return value === null || value === '' ? null : value;
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, blocked site data): the session lasts until reload.
  }
}

/**
 * Session tokens. Read outside React by the HTTP client; the signed-in staff member is server
 * state and lives in TanStack Query.
 */
export const useSessionStore = create<SessionState>()(() => ({
  accessToken: readToken(ACCESS_TOKEN_KEY),
  refreshToken: readToken(REFRESH_TOKEN_KEY),
  expired: false,
}));

useSessionStore.subscribe((state, previous) => {
  if (state.accessToken !== previous.accessToken) writeToken(ACCESS_TOKEN_KEY, state.accessToken);
  if (state.refreshToken !== previous.refreshToken) writeToken(REFRESH_TOKEN_KEY, state.refreshToken);
});

type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

export const session = {
  tokens(): SessionTokens | null {
    const { accessToken, refreshToken } = useSessionStore.getState();
    return accessToken ? { accessToken, refreshToken: refreshToken ?? '' } : null;
  },

  hasAccessToken(): boolean {
    return useSessionStore.getState().accessToken !== null;
  },

  /** Stores the tokens of a sign-in or a refresh. A new sign-in drops a pending expiry notice. */
  setTokens({ accessToken, refreshToken }: SessionTokens) {
    useSessionStore.setState({ accessToken, refreshToken, expired: false });
  },

  /** Signs out: clears the tokens and the activity stream cursor, with no expiry notice. */
  clear() {
    clearActivityCursor();
    useSessionStore.setState({ accessToken: null, refreshToken: null, expired: false });
  },

  /**
   * Ends the session because the backend rejected it (refresh answered 401/403, or the user is
   * blocked): clears the tokens, flags the notice, and tells the listeners (the app goes to /login).
   */
  expire() {
    clearActivityCursor();
    useSessionStore.setState({ accessToken: null, refreshToken: null, expired: true });
    for (const listener of expiredListeners) listener();
  },

  /** Whether the session expired since the last call; the login screen calls it once. */
  consumeExpired(): boolean {
    const { expired } = useSessionStore.getState();
    if (expired) useSessionStore.setState({ expired: false });
    return expired;
  },

  /** Registers a listener for `expire()`. Returns the unsubscribe function. */
  onExpired(listener: ExpiredListener): () => void {
    expiredListeners.add(listener);
    return () => expiredListeners.delete(listener);
  },
};
