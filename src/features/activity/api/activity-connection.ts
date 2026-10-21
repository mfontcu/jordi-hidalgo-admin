import { session } from '@/shared/api';

export {
  activityConnection,
  activityStreamCursor,
  rememberActivityCursor,
  setActivityConnection,
  type ActivityConnection,
  type ActivityStreamEvent,
  type ActivityStreamRow,
} from '@/shared/api';

/** Whether the shell still has an access token. The stream stops when this becomes false. */
export function hasActivitySession(): boolean {
  return session.hasAccessToken();
}
