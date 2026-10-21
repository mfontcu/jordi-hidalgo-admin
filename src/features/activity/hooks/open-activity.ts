import { useNavigate } from '@tanstack/react-router';

import type { ActivityDestination } from '../model/destination';

type Navigate = ReturnType<typeof useNavigate>;

/** Opens the notice with the router, so an unsaved form asks before leaving. */
export function openActivityDestination(navigate: Navigate, destination: ActivityDestination) {
  switch (destination.to) {
    case '/appointments/$appointmentId':
      void navigate({ to: destination.to, params: destination.params });
      return;
    case '/appointments':
      void navigate({ to: destination.to });
      return;
    case '/clients/$clientId':
      void navigate({ to: destination.to, params: destination.params });
      return;
    case '/clients':
      void navigate({ to: destination.to });
      return;
    case '/schedule/slot-watches':
      void navigate({ to: destination.to, search: 'search' in destination ? destination.search : {} });
      return;
  }
}
