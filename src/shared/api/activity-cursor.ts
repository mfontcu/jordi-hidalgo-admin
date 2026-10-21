/** Last id the activity stream has applied. It is not the read mark; reads live in the database. */
export const ACTIVITY_CURSOR_KEY = 'hj_admin.activity_cursor';

/** The stored cursor, or null when there is none or the value is not a non-negative integer. */
export function readActivityCursor(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVITY_CURSOR_KEY);
    if (raw === null || !/^\d+$/.test(raw)) return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) ? id : null;
  } catch {
    return null;
  }
}

/** Remembers the latest stream id. A later reconnect asks the server for rows after it. */
export function writeActivityCursor(id: number) {
  if (!Number.isSafeInteger(id) || id < 0) return;
  try {
    localStorage.setItem(ACTIVITY_CURSOR_KEY, String(id));
  } catch {
    // Storage unavailable: the next visit starts without a cursor.
  }
}

/** Drops the cursor. Sign-out and session expiry call it with the tokens. */
export function clearActivityCursor() {
  try {
    localStorage.removeItem(ACTIVITY_CURSOR_KEY);
  } catch {
    // Nothing to clear.
  }
}
