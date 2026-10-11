import '@tanstack/react-query';

// ADR-003, "Localization": a query whose content the backend localizes from `Accept-Language`
// (service names and categories) sets `meta: { localized: true }`, so a language change refetches it.
declare module '@tanstack/react-query' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface
  interface Register {
    queryMeta: { localized?: boolean };
  }
}
