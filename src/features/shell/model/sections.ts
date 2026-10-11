/** Paths of the sidebar sections (AdminRouter constants). */
export const SECTION_PATHS = [
  '/',
  '/schedule/availability',
  '/appointments',
  '/schedule/day-agenda',
  '/schedule/slot-watches',
  '/schedule/blocked-slots',
  '/schedule/working-hours',
  '/services',
  '/clients',
  '/admins',
  '/business',
] as const;

export type SectionPath = (typeof SECTION_PATHS)[number];

export type SidebarSection = {
  path: SectionPath;
  /** Key in icons.json (the Flutter `Icons.*` name). */
  icon: string;
  /** Message id of the label. */
  label: string;
};

/** The sidebar sections in the order of admin_sidebar.dart. */
export const SIDEBAR_SECTIONS = [
  { path: '/', icon: 'dashboard_outlined', label: 'adminNavDashboard' },
  { path: '/schedule/availability', icon: 'event_available_outlined', label: 'adminNavAvailability' },
  { path: '/appointments', icon: 'calendar_month_outlined', label: 'adminNavAppointments' },
  { path: '/schedule/day-agenda', icon: 'view_timeline_outlined', label: 'adminNavDayAgenda' },
  { path: '/schedule/slot-watches', icon: 'notifications_active_outlined', label: 'adminNavSlotWatches' },
  { path: '/schedule/blocked-slots', icon: 'block_outlined', label: 'adminNavBlockedSlots' },
  { path: '/schedule/working-hours', icon: 'schedule_outlined', label: 'adminNavWorkingHours' },
  { path: '/services', icon: 'content_cut_outlined', label: 'adminNavServices' },
  { path: '/clients', icon: 'people_outline', label: 'adminNavClients' },
  { path: '/admins', icon: 'admin_panel_settings_outlined', label: 'adminNavStaff' },
  { path: '/business', icon: 'storefront_outlined', label: 'adminNavBusiness' },
] as const satisfies readonly SidebarSection[];

export function isSectionPath(value: unknown): value is SectionPath {
  return typeof value === 'string' && (SECTION_PATHS as readonly string[]).includes(value);
}

// Path prefix → section, checked in order (AdminRouter.sidebarRouteFor).
const PREFIXES: readonly (readonly [string, SectionPath])[] = [
  ['/appointments', '/appointments'],
  ['/services', '/services'],
  ['/clients', '/clients'],
  ['/admins', '/admins'],
  ['/business', '/business'],
  ['/schedule/blocked-slots', '/schedule/blocked-slots'],
  ['/schedule/recurring-blocked-slots', '/schedule/blocked-slots'],
  ['/schedule/working-hours', '/schedule/working-hours'],
  ['/schedule/availability', '/schedule/availability'],
  ['/schedule/slot-watches', '/schedule/slot-watches'],
  ['/schedule/day-agenda', '/schedule/day-agenda'],
];

/**
 * The highlighted sidebar section (AdminRouter.sidebarRouteFor): the `sidebar` search parameter
 * when it names a section, else the section of the path prefix, else the dashboard.
 */
export function activeSectionFor(pathname: string, sidebar?: unknown): SectionPath {
  if (typeof sidebar === 'string' && isSectionPath(sidebar.trim())) return sidebar.trim() as SectionPath;
  return PREFIXES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? '/';
}
