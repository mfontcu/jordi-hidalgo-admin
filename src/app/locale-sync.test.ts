import { QueryClient } from '@tanstack/react-query';

import { useLocaleStore } from '@/shared/i18n';

import { wireLocalizedQueries } from './locale-sync';

function seed(queryClient: QueryClient, key: string, meta?: { localized: boolean }) {
  queryClient.getQueryCache().build(queryClient, { queryKey: [key], meta });
  queryClient.setQueryData([key], 'data');
}

describe('wireLocalizedQueries', () => {
  let queryClient: QueryClient;
  let stop: () => void;

  beforeEach(() => {
    queryClient = new QueryClient();
    seed(queryClient, 'localized', { localized: true });
    seed(queryClient, 'plain');
    useLocaleStore.setState({ locale: 'es' });
    stop = wireLocalizedQueries(queryClient);
  });

  afterEach(() => {
    stop();
  });

  it('invalidates only the queries marked as localized when the language changes', () => {
    useLocaleStore.getState().setLocale('ca');

    expect(queryClient.getQueryState(['localized'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['plain'])?.isInvalidated).toBe(false);
  });

  it('does nothing when the same language is chosen again', () => {
    useLocaleStore.getState().setLocale('es');

    expect(queryClient.getQueryState(['localized'])?.isInvalidated).toBe(false);
  });
});
