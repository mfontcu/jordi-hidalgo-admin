import type { QueryClient } from '@tanstack/react-query';

/** The service name already in the panel cache, from the catalog, a detail, or a form lookup. */
export function serviceNameFromCache(queryClient: QueryClient, serviceId: string | undefined): string | null {
  const id = serviceId?.trim();
  if (!id) return null;
  const names = new Map<string, string>();
  collect(['services'], queryClient, names);
  collect(['appointments', 'form', 'services'], queryClient, names);
  collect(['availability', 'services'], queryClient, names);
  return names.get(id) ?? null;
}

function collect(queryKey: readonly unknown[], queryClient: QueryClient, names: Map<string, string>) {
  for (const [, data] of queryClient.getQueriesData({ queryKey })) collectValue(data, names);
}

function collectValue(value: unknown, names: Map<string, string>) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectValue(item, names);
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id === 'string' && typeof record.name === 'string' && record.name.trim() !== '') {
    names.set(record.id, record.name);
  }
  if ('items' in record) collectValue(record.items, names);
}
