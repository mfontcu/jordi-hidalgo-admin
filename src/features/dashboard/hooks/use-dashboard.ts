import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { dashboardSummaryQueryOptions } from '../api/dashboard.queries';

/** Dashboard (DashboardScreen): the summary, and the four quick actions. */
export function useDashboard() {
  const summary = useQuery(dashboardSummaryQueryOptions());
  const navigate = useNavigate();

  return {
    summary: summary.data ?? null,
    isLoading: summary.isPending,
    error: summary.isError ? summary.error : null,
    retry: () => {
      void summary.refetch();
    },
    openAppointments: () => {
      void navigate({ to: '/appointments' });
    },
    openBlockedSlots: () => {
      void navigate({ to: '/schedule/blocked-slots' });
    },
    openWorkingHours: () => {
      void navigate({ to: '/schedule/working-hours' });
    },
    openServices: () => {
      void navigate({ to: '/services' });
    },
  };
}
