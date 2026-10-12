import { useLayoutEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import type { MessageId } from '@/shared/i18n';
import {
  businessDayOf,
  businessToday,
  clockTimeOf,
  formatDay,
  formatWeekdayShort,
  weekdayOf,
  type BusinessDay,
  type DateLocale,
} from '@/shared/lib/business-time';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icons/icon';
import { TableAction } from '@/shared/ui';

import { statusLabelOf, statusToneOf, type AppointmentItem } from '../model/appointment';
import {
  appointmentTimeRange,
  blockLabelOf,
  computeTimelineLayouts,
  densityForHeight,
  hourMarksOf,
  isWorkingDayClosed,
  laneBlockWidth,
  laneLeft,
  nowIndicatorTop,
  PIXELS_PER_MINUTE,
  stackPaintRank,
  TIME_GUTTER_WIDTH,
  timelineTotalMinutes,
  workingDayOf,
  type AgendaAppointment,
  type AgendaBlock,
  type AgendaWorkingDay,
  type TimelineRange,
} from '../model/day-agenda';

const STATUS_BLOCK: Record<ReturnType<typeof statusToneOf>, string> = {
  success: 'bg-success-bg text-success-fg border-success-fg/20',
  danger: 'bg-danger-bg text-danger-fg border-danger-fg/20',
  warning: 'bg-warning-bg text-warning-fg border-warning-fg/20',
  info: 'bg-info-bg text-info-fg border-info-fg/20',
  neutralStrong: 'bg-surface-muted text-on-surface border-outline/40',
  muted: 'bg-surface-muted text-content-muted border-outline/30',
};

type DayAgendaTimelineProps = {
  day: BusinessDay;
  range: TimelineRange;
  workingDays: readonly AgendaWorkingDay[];
  appointments: readonly AgendaAppointment[];
  blockedSlots: readonly AgendaBlock[];
  isCompact: boolean;
  showNowIndicator: boolean;
  onAppointmentTap: (item: AppointmentItem) => void;
  onCompleteTap: (item: AppointmentItem) => void;
  onCustomerPushTap: (item: AppointmentItem) => void;
  canComplete: (item: AppointmentItem) => boolean;
  canPush: (item: AppointmentItem) => boolean;
};

/** Single-day vertical timeline (`_DayAgendaTimeline`). */
export function DayAgendaTimeline({
  day,
  range,
  workingDays,
  appointments,
  blockedSlots,
  isCompact,
  showNowIndicator,
  onAppointmentTap,
  onCompleteTap,
  onCustomerPushTap,
  canComplete,
  canPush,
}: DayAgendaTimelineProps) {
  const closed = isWorkingDayClosed(workingDayOf(workingDays, day));
  const totalHeight = timelineTotalMinutes(range) * PIXELS_PER_MINUTE;
  const hours = hourMarksOf(range);
  const nowTop = showNowIndicator ? nowIndicatorTop(range) : null;

  return (
    <div className="flex min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      <TimeGutter hours={hours} range={range} height={totalHeight} />
      <div className="relative min-w-0 flex-1" style={{ height: totalHeight }}>
        <HourLines hours={hours} range={range} />
        {closed ? <ClosedHatch /> : null}
        <TimelineLane
          range={range}
          appointments={appointments}
          blockedSlots={blockedSlots}
          isCompact={isCompact}
          onAppointmentTap={onAppointmentTap}
          onCompleteTap={onCompleteTap}
          onCustomerPushTap={onCustomerPushTap}
          canComplete={canComplete}
          canPush={canPush}
        />
        {nowTop !== null ? <NowIndicator top={nowTop} /> : null}
      </div>
    </div>
  );
}

type WeekAgendaTimelineProps = {
  weekDays: readonly BusinessDay[];
  selectedDay: BusinessDay;
  range: TimelineRange;
  workingDays: readonly AgendaWorkingDay[];
  appointments: readonly AgendaAppointment[];
  blockedSlots: readonly AgendaBlock[];
  isCompact: boolean;
  onDaySelected: (day: BusinessDay) => void;
  onAppointmentTap: (item: AppointmentItem) => void;
  onCompleteTap: (item: AppointmentItem) => void;
  onCustomerPushTap: (item: AppointmentItem) => void;
  canComplete: (item: AppointmentItem) => boolean;
  canPush: (item: AppointmentItem) => boolean;
};

/** Week grid (`_DayAgendaWeekTimeline`): seven day columns under a shared time gutter. */
export function WeekAgendaTimeline({
  weekDays,
  selectedDay,
  range,
  workingDays,
  appointments,
  blockedSlots,
  isCompact,
  onDaySelected,
  onAppointmentTap,
  onCompleteTap,
  onCustomerPushTap,
  canComplete,
  canPush,
}: WeekAgendaTimelineProps) {
  const intl = useIntl();
  const locale = intl.locale as DateLocale;
  const today = businessToday();
  const totalHeight = timelineTotalMinutes(range) * PIXELS_PER_MINUTE;
  const hours = hourMarksOf(range);

  return (
    // overflow-y: clip keeps weekday headers sticky against the window while allowing horizontal scroll.
    <div
      className="min-w-0 rounded-lg border border-border bg-surface"
      style={{ overflowX: 'auto', overflowY: 'clip' }}
    >
      <div className="sticky top-0 z-20 flex min-w-[720px] border-b border-border bg-surface shadow-[0_1px_0_0_var(--border)]">
        <div
          style={{ width: TIME_GUTTER_WIDTH }}
          className="shrink-0 border-r border-border bg-surface-muted/40"
        />
        {weekDays.map((day) => {
          const selected = day === selectedDay;
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                onDaySelected(day);
              }}
              className={cn(
                'min-w-0 flex-1 border-l border-border px-1 py-2 text-center',
                selected && 'bg-primary/8',
                isToday && 'font-extrabold',
              )}
            >
              <div className="text-[11px] uppercase text-content-secondary">
                {formatWeekdayShort(weekdayOf(day), locale)}
              </div>
              <div className="text-[13px] text-on-surface">{formatDay(day, locale, 'dayMonth')}</div>
            </button>
          );
        })}
      </div>
      <div className="flex min-w-[720px]">
        <TimeGutter hours={hours} range={range} height={totalHeight} />
        <div className="relative flex min-w-0 flex-1" style={{ height: totalHeight }}>
          <HourLines hours={hours} range={range} />
          {weekDays.map((day) => {
            const dayAppointments = appointments.filter((item) => businessDayOf(item.start) === day);
            const dayBlocks = blockedSlots.filter(
              (block) => businessDayOf(block.startAt) === day || businessDayOf(block.endAt) === day,
            );
            const closed = isWorkingDayClosed(workingDayOf(workingDays, day));
            return (
              <div key={day} className="relative min-w-0 flex-1 border-l border-border">
                {closed ? <ClosedHatch /> : null}
                <TimelineLane
                  range={range}
                  appointments={dayAppointments}
                  blockedSlots={dayBlocks}
                  isCompact={isCompact}
                  onAppointmentTap={onAppointmentTap}
                  onCompleteTap={onCompleteTap}
                  onCustomerPushTap={onCustomerPushTap}
                  canComplete={canComplete}
                  canPush={canPush}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeGutter({ hours, range, height }: { hours: number[]; range: TimelineRange; height: number }) {
  return (
    <div
      className="relative shrink-0 border-r border-border bg-surface-muted/40 text-[11px] text-content-secondary"
      style={{ width: TIME_GUTTER_WIDTH, height }}
    >
      {hours.map((hour) => {
        const minutes = hour * 60 - range.startMinutes;
        if (minutes < 0) return null;
        return (
          <div
            key={hour}
            className="absolute right-2 -translate-y-1/2"
            style={{ top: minutes * PIXELS_PER_MINUTE }}
          >
            {clockTimeOf(hour * 60)}
          </div>
        );
      })}
    </div>
  );
}

function HourLines({ hours, range }: { hours: number[]; range: TimelineRange }) {
  return (
    <>
      {hours.map((hour) => {
        const minutes = hour * 60 - range.startMinutes;
        if (minutes < 0) return null;
        return (
          <div
            key={hour}
            className="pointer-events-none absolute inset-x-0 border-t border-border/80"
            style={{ top: minutes * PIXELS_PER_MINUTE }}
          />
        );
      })}
    </>
  );
}

function ClosedHatch() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--outline-variant) 6px, var(--outline-variant) 7px)',
      }}
      aria-hidden
    />
  );
}

function NowIndicator({ top }: { top: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll the page so "now" sits ~120 px below the viewport top (Flutter `_scrollToNow`).
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => {
      const target = Math.max(0, window.scrollY + node.getBoundingClientRect().top - 120);
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [top]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top }}>
      <span className="size-2 shrink-0 rounded-full bg-selection-fg" />
      <span className="h-0.5 flex-1 bg-selection-fg/85" />
    </div>
  );
}

type LaneProps = {
  range: TimelineRange;
  appointments: readonly AgendaAppointment[];
  blockedSlots: readonly AgendaBlock[];
  isCompact: boolean;
  onAppointmentTap: (item: AppointmentItem) => void;
  onCompleteTap: (item: AppointmentItem) => void;
  onCustomerPushTap: (item: AppointmentItem) => void;
  canComplete: (item: AppointmentItem) => boolean;
  canPush: (item: AppointmentItem) => boolean;
};

function TimelineLane(props: LaneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      setWidth(node.getBoundingClientRect().width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  const intl = useIntl();
  const text = (id: MessageId, values?: Record<string, string>) => intl.formatMessage({ id }, values);
  const layouts = computeTimelineLayouts(props.appointments, props.blockedSlots, props.range);
  const painted = [...layouts.appointments].sort(
    (a, b) => stackPaintRank(a.appointment.status) - stackPaintRank(b.appointment.status),
  );
  // jsdom reports 0 until layout; paint with a fallback so tests and the first frame still show blocks.
  const laneWidth = width > 0 ? width : 320;

  return (
    <div ref={ref} className="absolute inset-0">
      {layouts.blockedSlots.map((layout) => {
        const left = laneLeft(laneWidth, layout.column, layout.columnCount);
        const blockWidth = laneBlockWidth(laneWidth, layout.columnCount);
        const density = densityForHeight(layout.height);
        return (
          <div
            key={layout.block.id}
            className="absolute overflow-hidden rounded-sm border border-outline/50 bg-surface-muted/90"
            style={{ top: layout.top, left, width: blockWidth, height: layout.height }}
          >
            <div
              className={cn(
                'absolute inset-y-0 left-0 w-1',
                layout.block.isRecurring ? 'bg-warning-fg/75' : 'bg-content-secondary/65',
              )}
            />
            <div className="flex h-full items-center gap-1.5 px-2 py-1">
              <Icon
                name={layout.block.isRecurring ? 'repeat_rounded' : 'block_outlined'}
                size={density === 'compact' ? 14 : 16}
                className="shrink-0 text-content-secondary"
              />
              <span
                className={cn(
                  'min-w-0 truncate font-bold text-on-surface',
                  density === 'compact' ? 'text-[11px]' : 'text-[12px]',
                )}
              >
                {blockLabelOf(layout.block, text('dayAgendaBlockedSlotRecurring'), (timeRange) =>
                  text('dayAgendaBlockedSlotWithTime', { timeRange }),
                )}
              </span>
            </div>
          </div>
        );
      })}
      {painted.map((layout) => {
        const left = laneLeft(laneWidth, layout.column, layout.columnCount);
        const blockWidth = laneBlockWidth(laneWidth, layout.columnCount);
        const density = densityForHeight(layout.height);
        const item = layout.appointment;
        const tone = statusToneOf(item.status);
        const labelId = statusLabelOf(item.status);
        const background = stackPaintRank(item.status) <= 1;
        const showActions = density !== 'compact' && blockWidth > 120;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              props.onAppointmentTap(item);
            }}
            className={cn(
              'absolute overflow-hidden rounded-sm border text-left',
              STATUS_BLOCK[tone],
              !background && layout.columnCount > 1 && 'shadow-sm',
            )}
            style={{ top: layout.top, left, width: blockWidth, height: layout.height }}
          >
            <div className={cn('flex h-full gap-1', props.isCompact ? 'px-1.5 py-1' : 'px-2 py-1.5')}>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'truncate font-extrabold',
                    density === 'compact' ? 'text-[11px]' : 'text-[12px]',
                  )}
                >
                  {item.customerName.trim() || text('appointmentNoClient')}
                </div>
                {density !== 'compact' ? (
                  <div className="truncate text-[11px] opacity-90">
                    {appointmentTimeRange(item)}
                    {item.serviceName ? ` · ${item.serviceName}` : ''}
                  </div>
                ) : null}
                {density === 'full' && labelId ? (
                  <div className="mt-0.5 text-[10px] font-bold uppercase opacity-80">{text(labelId)}</div>
                ) : null}
              </div>
              {showActions ? (
                <div
                  className="flex shrink-0 flex-col justify-center gap-0.5"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                  }}
                  role="presentation"
                >
                  {props.canComplete(item) ? (
                    <TableAction
                      icon="check_circle_outline"
                      label={text('dayAgendaTooltipComplete')}
                      tone="success"
                      onClick={() => {
                        props.onCompleteTap(item);
                      }}
                    />
                  ) : null}
                  {props.canPush(item) ? (
                    <TableAction
                      icon="notifications_active_outlined"
                      label={text('dayAgendaTooltipCustomerPush')}
                      onClick={() => {
                        props.onCustomerPushTap(item);
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
