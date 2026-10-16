import { type AnyRoute, createRouter } from '@tanstack/react-router';

type RouteInfo = { id: string; fullPath: string; options: AnyRoute['options'] };

import { queryClient } from './query-client';
import { routeTree } from './routeTree.gen';

// Every final path of the former Flutter panel.
const CHECKLIST_PATHS = [
  '/',
  '/services',
  '/services/$serviceId',
  '/services/form',
  '/services/$serviceId/form',
  '/admins',
  '/admins/$staffId',
  '/admins/form',
  '/admins/$staffId/form',
  '/clients',
  '/clients/$clientId',
  '/clients/form',
  '/clients/$clientId/form',
  '/schedule/working-hours',
  '/schedule/blocked-slots',
  '/schedule/blocked-slots/form',
  '/schedule/blocked-slots/$blockedSlotId',
  '/schedule/blocked-slots/$blockedSlotId/form',
  '/schedule/recurring-blocked-slots/form',
  '/schedule/recurring-blocked-slots/$ruleId',
  '/schedule/recurring-blocked-slots/$ruleId/form',
  '/appointments',
  '/appointments/$appointmentId',
  '/appointments/$appointmentId/reschedule',
  '/appointments/form',
  '/schedule/day-agenda',
  '/schedule/availability',
  '/business',
  '/schedule/slot-watches',
];

const LEGACY_ALIASES = [
  '/appointments/detail',
  '/appointments/reschedule',
  '/services/detail',
  '/clients/detail',
  '/admins/detail',
  '/schedule/blocked-slots/detail',
  '/schedule/recurring-blocked-slots',
  '/schedule/recurring-blocked-slots/detail',
];

const router = createRouter({ routeTree, context: { queryClient } });
const routes = Object.values(router.routesById as unknown as Record<string, RouteInfo>).filter((route) =>
  route.id.startsWith('/_authed/'),
);
const normalize = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path);

describe('signed-in route tree', () => {
  it('registers every checklist path, each naming its screen for the shell header', () => {
    const screens = routes.filter((route) => route.options.staticData?.screen);
    expect(screens.map((route) => normalize(route.fullPath)).sort()).toEqual([...CHECKLIST_PATHS].sort());
  });

  it('registers the legacy aliases, which render nothing of their own', () => {
    const aliases = routes.filter((route) => !route.options.staticData?.screen && route.id !== '/_authed/$');
    expect(aliases.map((route) => normalize(route.fullPath)).sort()).toEqual([...LEGACY_ALIASES].sort());
    for (const alias of aliases) {
      expect(alias.options.component).toBeUndefined();
      expect(alias.options.beforeLoad).toBeTypeOf('function');
    }
  });
});
