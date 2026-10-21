import { ACTIVITY_CURSOR_KEY, readActivityCursor, writeActivityCursor } from './activity-cursor';
import { session } from './session-store';

describe('activity cursor', () => {
  it('stores the last stream id and drops it when the session ends', () => {
    writeActivityCursor(42);
    expect(readActivityCursor()).toBe(42);
    expect(localStorage.getItem(ACTIVITY_CURSOR_KEY)).toBe('42');

    session.setTokens({ accessToken: 'access', refreshToken: 'refresh' });
    session.clear();
    expect(readActivityCursor()).toBeNull();

    writeActivityCursor(7);
    session.setTokens({ accessToken: 'access', refreshToken: 'refresh' });
    session.expire();
    expect(readActivityCursor()).toBeNull();
    expect(localStorage.getItem('hj_admin.access_token')).toBeNull();
  });

  it('ignores a value that is not a cursor', () => {
    localStorage.setItem(ACTIVITY_CURSOR_KEY, 'nope');
    expect(readActivityCursor()).toBeNull();
  });
});
