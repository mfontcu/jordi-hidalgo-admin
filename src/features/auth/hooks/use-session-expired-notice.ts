import { useEffect, useRef } from 'react';

import { consumeSessionExpired } from '../api/session';

/** Calls `onExpired` once if the login screen opened because the session expired. */
export function useSessionExpiredNotice(onExpired: () => void) {
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  useEffect(() => {
    if (consumeSessionExpired()) onExpiredRef.current();
  }, []);
}
