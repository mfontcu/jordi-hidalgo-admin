import { clockTimeOfInstant, formatClockTime, type DateLocale } from '@/shared/lib/business-time';

/** The next appointment on the dashboard (AdminDashboardNextAppointment). */
export type NextAppointment = {
  id: string;
  startAt: string;
  serviceName: string;
  customerName: string;
  customerAvatarUrl: string | null;
};

/** Aggregates of `GET /admin/dashboard/summary`. */
export type DashboardSummary = {
  appointmentsToday: number;
  pendingAppointments: number;
  freeSlotsToday: number;
  clientsThisWeek: number;
  nextAppointment: NextAppointment | null;
};

/** The next appointment's salon clock (the `time` the Flutter hero prints), or null when there is none. */
export function nextAppointmentTime(next: NextAppointment | null, locale: DateLocale): string | null {
  if (!next) return null;
  const clock = clockTimeOfInstant(next.startAt);
  return clock ? formatClockTime(clock, locale, 'HH:mm') : null;
}

/**
 * Dashboard layout by content width (DashboardScreen._DashboardLayoutSpec). The hero title in
 * Flutter is drawn at 30px once the spec's size passes 36, and at 24px otherwise.
 */
export type DashboardLayout = {
  pagePadding: number;
  gridSpacing: number;
  sectionGap: number;
  sectionGapLarge: number;
  statsColumns: number;
  actionColumns: number;
  statsCardHeight: number;
  actionCardHeight: number;
  heroPadding: number;
  heroTitleSize: number;
  heroSubtitleSize: number;
  sectionTitleSize: number;
  statValueSize: number;
  actionTitleSize: number;
};

export function dashboardLayoutFor(width: number): DashboardLayout {
  if (width < 560) {
    return {
      pagePadding: 16,
      gridSpacing: 12,
      sectionGap: 20,
      sectionGapLarge: 28,
      statsColumns: 1,
      actionColumns: 1,
      statsCardHeight: 160,
      actionCardHeight: 208,
      heroPadding: 20,
      heroTitleSize: 24,
      heroSubtitleSize: 14,
      sectionTitleSize: 22,
      statValueSize: 38,
      actionTitleSize: 18,
    };
  }
  if (width < 840) {
    return {
      pagePadding: 20,
      gridSpacing: 14,
      sectionGap: 22,
      sectionGapLarge: 30,
      statsColumns: 2,
      actionColumns: 2,
      statsCardHeight: 170,
      actionCardHeight: 220,
      heroPadding: 22,
      heroTitleSize: 24,
      heroSubtitleSize: 15,
      sectionTitleSize: 24,
      statValueSize: 42,
      actionTitleSize: 18,
    };
  }
  if (width < 1180) {
    return {
      pagePadding: 24,
      gridSpacing: 16,
      sectionGap: 24,
      sectionGapLarge: 32,
      statsColumns: 3,
      actionColumns: 3,
      statsCardHeight: 176,
      actionCardHeight: 224,
      heroPadding: 24,
      heroTitleSize: 30,
      heroSubtitleSize: 16,
      sectionTitleSize: 26,
      statValueSize: 44,
      actionTitleSize: 19,
    };
  }
  return {
    pagePadding: 24,
    gridSpacing: 16,
    sectionGap: 24,
    sectionGapLarge: 32,
    statsColumns: 4,
    actionColumns: 4,
    statsCardHeight: 176,
    actionCardHeight: 224,
    heroPadding: 26,
    heroTitleSize: 30,
    heroSubtitleSize: 16,
    sectionTitleSize: 26,
    statValueSize: 44,
    actionTitleSize: 19,
  };
}
