import type { ShellScreen } from '../model/header';

// Each signed-in route names its screen, which picks the header the shell shows.
declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface
  interface StaticDataRouteOption {
    screen?: ShellScreen;
  }
}
