/**
 * Header of a signed-in screen: title, subtitle, and breadcrumbs as message ids
 * (admin_shell.dart `shellHeaderDataFor`). The mobile header shows it, and so do the placeholder
 * screens until each feature builds its own.
 */
export type ShellHeader = {
  title: string;
  subtitle: string;
  breadcrumbs?: readonly string[];
};

const detail = 'shellBreadcrumbDetail';
const form = 'shellBreadcrumbForm';
const appointments = 'adminNavAppointments';
const clients = 'adminNavClients';
const services = 'adminNavServices';
const staff = 'adminNavStaff';
const blocks = 'adminNavBlockedSlots';
const recurring = 'scheduleSectionRecurring';

/**
 * Every header, by screen. Flutter falls back to the dashboard header for the blocked-slot edit
 * form and both recurring-rule forms; here they get their own.
 */
export const SHELL_HEADERS = {
  dashboard: { title: 'adminNavDashboard', subtitle: 'shellHeaderDashboardSubtitle' },
  appointments: { title: 'appointmentListTitle', subtitle: 'appointmentListSubtitle' },
  appointmentDetail: {
    title: 'appointmentDetailTitle',
    subtitle: 'appointmentDetailSubtitle',
    breadcrumbs: [appointments, detail],
  },
  appointmentForm: {
    title: 'shellHeaderAppointmentFormTitle',
    subtitle: 'shellHeaderAppointmentFormSubtitle',
    breadcrumbs: [appointments, form],
  },
  appointmentReschedule: {
    title: 'appointmentRescheduleTitle',
    subtitle: 'shellHeaderAppointmentRescheduleSubtitle',
    breadcrumbs: [appointments, 'shellBreadcrumbReschedule'],
  },
  clients: { title: 'clientListTitle', subtitle: 'clientListSubtitle' },
  clientDetail: {
    title: 'clientDetailTitle',
    subtitle: 'clientDetailSubtitle',
    breadcrumbs: [clients, detail],
  },
  clientForm: {
    title: 'shellHeaderClientFormTitle',
    subtitle: 'shellHeaderClientFormSubtitle',
    breadcrumbs: [clients, form],
  },
  business: { title: 'shellHeaderBusinessTitle', subtitle: 'shellHeaderBusinessSubtitle' },
  staff: { title: 'staffListTitle', subtitle: 'staffListSubtitle' },
  staffDetail: { title: 'staffDetailTitle', subtitle: 'staffDetailSubtitle', breadcrumbs: [staff, detail] },
  staffForm: {
    title: 'shellHeaderStaffFormTitle',
    subtitle: 'shellHeaderStaffFormSubtitle',
    breadcrumbs: [staff, form],
  },
  services: { title: 'serviceListTitle', subtitle: 'shellHeaderServicesSubtitle' },
  serviceDetail: {
    title: 'serviceDetailTitle',
    subtitle: 'serviceDetailSubtitle',
    breadcrumbs: [services, detail],
  },
  serviceForm: {
    title: 'shellHeaderServiceFormTitle',
    subtitle: 'shellHeaderServiceFormSubtitle',
    breadcrumbs: [services, form],
  },
  blockedSlots: { title: 'adminNavBlockedSlots', subtitle: 'shellHeaderBlockedSlotsSubtitle' },
  blockedSlotDetail: {
    title: 'scheduleBlockedSlotDetailTitle',
    subtitle: 'scheduleBlockedSlotDetailSubtitle',
    breadcrumbs: [blocks, detail],
  },
  blockedSlotForm: {
    title: 'shellHeaderBlockedSlotFormTitle',
    subtitle: 'shellHeaderBlockedSlotFormSubtitle',
    breadcrumbs: [blocks, form],
  },
  recurringBlockedSlotDetail: {
    title: 'scheduleRecurringBlockedSlotDetailTitle',
    subtitle: 'scheduleRecurringBlockedSlotDetailSubtitle',
    breadcrumbs: [blocks, recurring, detail],
  },
  recurringBlockedSlotForm: {
    title: 'shellHeaderRecurringBlockedSlotFormTitle',
    subtitle: 'shellHeaderRecurringBlockedSlotFormSubtitle',
    breadcrumbs: [blocks, recurring, form],
  },
  workingHours: { title: 'scheduleWorkingHoursTitle', subtitle: 'shellHeaderWorkingHoursSubtitle' },
  availability: { title: 'availabilityOverviewTitle', subtitle: 'shellHeaderAvailabilitySubtitle' },
  slotWatches: { title: 'slotWatchAdminTitle', subtitle: 'shellHeaderSlotWatchesSubtitle' },
  dayAgenda: { title: 'dayAgendaTitle', subtitle: 'dayAgendaSubtitle' },
} as const satisfies Record<string, ShellHeader>;

export type ShellScreen = keyof typeof SHELL_HEADERS;
