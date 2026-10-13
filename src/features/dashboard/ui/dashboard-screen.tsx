import type { CSSProperties } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, useLocaleStore, type MessageId } from '@/shared/i18n';
import { Avatar, Button, EmptyState, Icon, Spinner, useElementWidth, type IconName } from '@/shared/ui';

import { useDashboard } from '../hooks/use-dashboard';
import {
  dashboardLayoutFor,
  nextAppointmentTime,
  type DashboardLayout,
  type DashboardSummary,
} from '../model/dashboard';

type Dashboard = ReturnType<typeof useDashboard>;

/** `/` (DashboardScreen): the day's hero, four stats, and the quick actions. */
export function DashboardScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const [ref, width] = useElementWidth();
  const layout = dashboardLayoutFor(width ?? 1440);
  const dashboard = useDashboard();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const style = {
    padding: layout.pagePadding,
    '--section-gap': `${layout.sectionGap}px`,
    '--section-gap-lg': `${layout.sectionGapLarge}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={style} className="flex flex-col">
          <div className="mb-(--section-gap) max-[767px]:sr-only">
            <h1 className="text-title text-foreground">{text('adminNavDashboard')}</h1>
            <p className="mt-2 text-body text-muted-foreground">{text('shellHeaderDashboardSubtitle')}</p>
          </div>
          {dashboard.isLoading && !dashboard.summary ? (
            <div className="flex justify-center py-8">
              <Spinner size={36} className="text-primary" />
            </div>
          ) : dashboard.error && !dashboard.summary ? (
            <EmptyState
              icon="error_outline"
              title={text('dashboardLoadError')}
              message={describeFailure(dashboard.error)}
              action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: dashboard.retry }}
            />
          ) : (
            <>
              {dashboard.error && (
                <div className="mb-(--section-gap) flex items-center gap-3 rounded-lg bg-destructive-wash p-4 text-destructive">
                  <Icon name="error_outline" />
                  <p className="flex-1 font-bold">{text('dashboardLoadError')}</p>
                  <Button variant="text" onClick={dashboard.retry}>
                    {text('adminCommonRetry')}
                  </Button>
                </div>
              )}
              <Hero layout={layout} summary={dashboard.summary} />
              <div className="mt-(--section-gap)">
                <Stats layout={layout} summary={dashboard.summary} />
              </div>
              <h2 className="mt-(--section-gap-lg) text-heading text-foreground">
                {text('dashboardSectionQuickActions')}
              </h2>
              <div className="mt-3">
                <QuickActions layout={layout} dashboard={dashboard} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Hero({ layout, summary }: { layout: DashboardLayout; summary: DashboardSummary | null }) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const appointments = summary?.appointmentsToday ?? 0;
  const free = summary?.freeSlotsToday ?? 0;
  const time = nextAppointmentTime(summary?.nextAppointment ?? null, locale);
  const pill = (label: string, tone: 'info' | 'success' | 'warning') => (
    <span
      className={
        tone === 'info'
          ? 'rounded-full bg-selection-wash px-3 py-2 text-label text-selection'
          : tone === 'success'
            ? 'rounded-full bg-success-wash px-3 py-2 text-label text-success'
            : 'rounded-full bg-warning-wash px-3 py-2 text-label text-warning'
      }
    >
      {label}
    </span>
  );

  return (
    <section className="rounded-xl border border-border bg-card" style={{ padding: layout.heroPadding }}>
      <p className="text-body-strong text-muted-foreground">
        {intl.formatMessage({ id: 'dashboardHeroEyebrow' })}
      </p>
      <p className="mt-2 text-title text-foreground">
        {intl.formatMessage(
          { id: 'dashboardHeroTitle' },
          { appointmentsToday: appointments, freeSlotsToday: free },
        )}
      </p>
      <p className="mt-2.5 text-body text-muted-foreground">
        {time
          ? intl.formatMessage({ id: 'dashboardHeroSubtitleNext' }, { nextTime: time })
          : intl.formatMessage({ id: 'dashboardHeroSubtitleEmpty' })}
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {pill(
          intl.formatMessage({ id: 'dashboardHeroPillAppointmentsToday' }, { count: appointments }),
          'info',
        )}
        {pill(intl.formatMessage({ id: 'dashboardHeroPillFreeSlots' }, { count: free }), 'success')}
        {pill(
          time
            ? intl.formatMessage({ id: 'dashboardHeroPillNextAppointment' }, { nextTime: time })
            : intl.formatMessage({ id: 'dashboardHeroPillNoNextAppointment' }),
          'warning',
        )}
      </div>
    </section>
  );
}

function Stats({ layout, summary }: { layout: DashboardLayout; summary: DashboardSummary | null }) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const next = summary?.nextAppointment ?? null;
  const time = nextAppointmentTime(next, locale);
  const cards: { title: MessageId; value: string; subtitle: string; avatar?: string | null }[] = [
    {
      title: 'dashboardStatAppointmentsToday',
      value: String(summary?.appointmentsToday ?? 0),
      subtitle: intl.formatMessage(
        { id: 'dashboardStatAppointmentsTodayPendingSubtitle' },
        { count: summary?.pendingAppointments ?? 0 },
      ),
    },
    {
      title: 'dashboardStatNextAppointment',
      value: time ?? '—',
      subtitle: next
        ? intl.formatMessage(
            { id: 'dashboardStatNextAppointmentSubtitle' },
            { serviceName: next.serviceName, customerName: next.customerName },
          )
        : intl.formatMessage({ id: 'dashboardStatNextAppointmentEmpty' }),
      avatar: next?.customerAvatarUrl,
    },
    {
      title: 'dashboardStatFreeSlots',
      value: String(summary?.freeSlotsToday ?? 0),
      subtitle: intl.formatMessage({ id: 'dashboardStatFreeSlotsSubtitle' }),
    },
    {
      title: 'dashboardStatClientsThisWeek',
      value: String(summary?.clientsThisWeek ?? 0),
      subtitle: intl.formatMessage({ id: 'dashboardStatClientsThisWeekSubtitle' }),
    },
  ];

  return (
    <div
      className="grid"
      style={{
        gap: layout.gridSpacing,
        gridTemplateColumns: `repeat(${layout.statsColumns}, minmax(0, 1fr))`,
        gridAutoRows: layout.statsCardHeight,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          className="flex flex-col justify-center rounded-lg border border-border bg-card px-4 py-3.5 text-center"
        >
          <p className="truncate text-label text-muted-foreground">
            {intl.formatMessage({ id: card.title })}
          </p>
          <p className="mt-2 truncate text-heading text-foreground">{card.value}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {card.avatar && (
              <Avatar
                src={card.avatar}
                size={36}
                viewLabel={intl.formatMessage({ id: 'adminUserViewPhoto' })}
              />
            )}
            <p className="line-clamp-2 text-body text-muted-foreground">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActions({ layout, dashboard }: { layout: DashboardLayout; dashboard: Dashboard }) {
  const intl = useIntl();
  const actions: {
    icon: IconName;
    title: MessageId;
    subtitle: MessageId;
    onClick: () => void;
  }[] = [
    {
      icon: 'calendar_month_outlined',
      title: 'dashboardQuickActionViewAppointments',
      subtitle: 'dashboardQuickActionViewAppointmentsSubtitle',
      onClick: dashboard.openAppointments,
    },
    {
      icon: 'block_outlined',
      title: 'dashboardQuickActionBlockSlot',
      subtitle: 'dashboardQuickActionBlockSlotSubtitle',
      onClick: dashboard.openBlockedSlots,
    },
    {
      icon: 'schedule_outlined',
      title: 'dashboardQuickActionEditHours',
      subtitle: 'dashboardQuickActionEditHoursSubtitle',
      onClick: dashboard.openWorkingHours,
    },
    {
      icon: 'content_cut_outlined',
      title: 'dashboardQuickActionManageServices',
      subtitle: 'dashboardQuickActionManageServicesSubtitle',
      onClick: dashboard.openServices,
    },
  ];

  return (
    <div
      className="grid"
      style={{
        gap: layout.gridSpacing,
        gridTemplateColumns: `repeat(${layout.actionColumns}, minmax(0, 1fr))`,
        gridAutoRows: layout.actionCardHeight,
      }}
    >
      {actions.map((action) => (
        <div key={action.title} className="flex flex-col rounded-lg border border-border bg-card p-5">
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-card text-foreground">
            <Icon name={action.icon} size={20} />
          </span>
          <p className="mt-4 line-clamp-2 text-heading text-foreground">
            {intl.formatMessage({ id: action.title })}
          </p>
          <p className="mt-2.5 line-clamp-2 text-body text-muted-foreground">
            {intl.formatMessage({ id: action.subtitle })}
          </p>
          <div className="mt-auto pt-3">
            <Button icon="arrow_forward_rounded" onClick={action.onClick}>
              {intl.formatMessage({ id: 'dashboardQuickActionOpen' })}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
