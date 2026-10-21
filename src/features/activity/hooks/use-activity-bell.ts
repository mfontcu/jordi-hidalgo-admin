import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { type MarkActivityReadBody, markActivityRead } from '../api/activity.mutations';
import { unreadActivityQueryOptions } from '../api/activity.queries';
import { serviceNameFromCache } from '../api/service-catalog';
import { destination } from '../model/destination';
import type { ActivityItem } from '../model/refresh';
import { openActivityDestination } from './open-activity';

/**
 * The unread list for the bell. Marking one, the selection, or all of them calls
 * `POST /admin/activity/read`. Opening a row marks that id and navigates. The toast does not.
 */
export function useActivityBell(onMarkError: (error: unknown) => void) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const onError = useRef(onMarkError);
  useEffect(() => {
    onError.current = onMarkError;
  });
  const list = useQuery(unreadActivityQueryOptions());
  const mark = useMutation({
    mutationFn: (body: MarkActivityReadBody) => markActivityRead(queryClient, body),
    onError: (error) => {
      onError.current(error);
    },
  });

  return {
    items: list.data ?? [],
    isLoading: list.isPending,
    error: list.isError ? list.error : null,
    retry: () => {
      void list.refetch();
    },
    serviceName: (serviceId: string | undefined) => serviceNameFromCache(queryClient, serviceId),
    markOne: (id: number) => {
      mark.mutate({ ids: [id] });
    },
    markIds: (ids: number[]) => {
      if (ids.length === 0) return;
      mark.mutate({ ids });
    },
    markAll: () => {
      mark.mutate({ all: true });
    },
    open: (item: ActivityItem) => {
      const target = destination(item.kind, item.payload);
      mark.mutate({ ids: [item.id] });
      if (target) openActivityDestination(navigate, target);
    },
  };
}
