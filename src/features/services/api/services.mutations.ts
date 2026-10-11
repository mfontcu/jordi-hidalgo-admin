import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { Service } from '../model/service';
import type { CreateServiceInput } from '../model/service-form';
import { servicesKeys } from './services.keys';
import { toService } from './services.mappers';

// Writes of the services feature. Each one names the queries it changes next to the call; the
// hooks run them as TanStack Query mutations.

const path = (serviceId: string) => ({ params: { path: { serviceID: serviceId } } });

/** Lists hold the summary counts and the order, so every write refreshes them. */
function refreshLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
}

/** Keeps the service the backend answered with, and refreshes the lists. */
function storeService(queryClient: QueryClient, service: Service) {
  queryClient.setQueryData(servicesKeys.detail(service.id), service);
  return refreshLists(queryClient);
}

/** `POST /admin/services`: a new service, or a new version of one. */
export async function createService(queryClient: QueryClient, input: CreateServiceInput): Promise<Service> {
  const service = toService(unwrap(await apiClient.POST('/admin/services', { body: input })));
  await storeService(queryClient, service);
  return service;
}

/** `PATCH /admin/services/{id}/activate` or `/deactivate`. */
export async function setServiceActive(queryClient: QueryClient, serviceId: string, active: boolean) {
  if (active) {
    unwrap(await apiClient.PATCH('/admin/services/{serviceID}/activate', path(serviceId)));
  } else {
    unwrap(await apiClient.PATCH('/admin/services/{serviceID}/deactivate', path(serviceId)));
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: servicesKeys.detail(serviceId) }),
    refreshLists(queryClient),
  ]);
}

/** `DELETE /admin/services/{id}` (a logical delete). */
export async function deleteService(queryClient: QueryClient, serviceId: string) {
  unwrap(await apiClient.DELETE('/admin/services/{serviceID}', path(serviceId)));
  queryClient.removeQueries({ queryKey: servicesKeys.detail(serviceId) });
  await refreshLists(queryClient);
}

/** `PATCH /admin/services/{id}/display-order`. */
export async function updateDisplayOrder(queryClient: QueryClient, serviceId: string, displayOrder: number) {
  const service = toService(
    unwrap(
      await apiClient.PATCH('/admin/services/{serviceID}/display-order', {
        ...path(serviceId),
        body: { displayOrder },
      }),
    ),
  );
  await storeService(queryClient, service);
  return service;
}

/** `PATCH /admin/services/{id}/show-on-public-site`. */
export async function updateShowOnPublicSite(
  queryClient: QueryClient,
  serviceId: string,
  showOnPublicSite: boolean,
) {
  const service = toService(
    unwrap(
      await apiClient.PATCH('/admin/services/{serviceID}/show-on-public-site', {
        ...path(serviceId),
        body: { showOnPublicSite },
      }),
    ),
  );
  await storeService(queryClient, service);
  return service;
}
