import { useQueryClient } from '@tanstack/react-query';

import { serviceNameFromCache } from '../api/service-catalog';

/** Looks up a service name in whatever catalog the panel has already cached. */
export function useServiceName() {
  const queryClient = useQueryClient();
  return (serviceId: string | undefined) => serviceNameFromCache(queryClient, serviceId);
}
