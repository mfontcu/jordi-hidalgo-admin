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
          <div className="mb-(--section-gap) max-[699px]:sr-only">
            <h1 className="text-[26px] font-black text-on-surface">{text('adminNavDashboard')}</h1>
            <p className="mt-2 leading-[1.5] text-content-secondary">
              {text('shellHeaderDashboardSubtitle')}
            </p>
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
                <div className="mb-(--section-gap) flex items-center gap-3 rounded-lg bg-danger-bg p-4 text-danger-fg">
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
              <h2
                className="mt-(--section-gap-lg) font-black text-on-surface"
                style={{ fontSize: layout.sectionTitleSize }}
              >
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
          ? 'rounded-pill bg-info-bg px-3 py-2 text-[13px] font-bold text-info-fg'
          : tone === 'success'
            ? 'rounded-pill bg-success-bg px-3 py-2 text-[13px] font-bold text-success-fg'
            : 'rounded-pill bg-warning-bg px-3 py-2 text-[13px] font-bold text-warning-fg'
      }
    >
      {label}
    </span>
  );

  return (
    <section
      className="rounded-xl border border-outline-variant bg-surface shadow-[0_6px_14px_rgb(0_0_0/0.03)]"
      style={{ padding: layout.heroPadding }}
    >
      <div className="h-1 w-[88px] rounded-pill bg-linear-to-r from-brand-red via-on-surface to-brand-blue" />
      <p className="mt-4 text-[14px] font-bold text-content-secondary">
        {intl.formatMessage({ id: 'dashboardHeroEyebrow' })}
      </p>
      <p
        className="mt-2 font-black text-on-surface"
        style={{ fontSize: layout.heroTitleSize, lineHeight: 1.1 }}
      >
        {intl.formatMessage(
          { id: 'dashboardHeroTitle' },
          { appointmentsToday: appointments, freeSlotsToday: free },
        )}
      </p>
      <p
        className="mt-2.5 leading-[1.5] text-content-secondary"
        style={{ fontSize: layout.heroSubtitleSize }}
      >
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
          className="flex flex-col justify-center rounded-lg border border-border bg-surface px-4 py-3.5 text-center"
        >
          <p className="truncate text-[14px] font-bold text-content-secondary">
            {intl.formatMessage({ id: card.title })}
          </p>
          <p
            className="mt-3.5 truncate leading-none font-black text-on-surface"
            style={{ fontSize: layout.statValueSize }}
          >
            {card.value}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {card.avatar && (
              <Avatar
                src={card.avatar}
                size={36}
                viewLabel={intl.formatMessage({ id: 'adminUserViewPhoto' })}
              />
            )}
            <p className="line-clamp-2 leading-[1.35] text-content-secondary">{card.subtitle}</p>
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
        <div key={action.title} className="flex flex-col rounded-lg border border-border bg-surface p-5">
          <span className="inline-flex size-[46px] items-center justify-center rounded-[14px] bg-surface-muted text-on-surface">
            <Icon name={action.icon} size={24} />
          </span>
          <p
            className="mt-[18px] line-clamp-2 font-extrabold text-on-surface"
            style={{ fontSize: layout.actionTitleSize, lineHeight: 1.15 }}
          >
            {intl.formatMessage({ id: action.title })}
          </p>
          <p className="mt-2.5 line-clamp-2 text-[14px] leading-[1.45] text-content-secondary">
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
