import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { addDays, type BusinessDay, type DateLocale } from '@/shared/lib/business-time';
import {
  Button,
  ConfirmDialog,
  DateInputField,
  EmptyState,
  FilterPicker,
  ListPage,
  PromptDialog,
  RemovableChip,
  SearchField,
  SegmentedTabs,
  Spinner,
  StatCard,
  SummaryGrid,
  ToolbarField,
  showErrorToast,
  showToast,
  useListLayout,
  useWindowNarrowerThan,
} from '@/shared/ui';
import { Icon } from '@/shared/ui/icons/icon';

import { useDayAgenda } from '../hooks/use-day-agenda';
import type { AppointmentItem } from '../model/appointment';
import { weekRangeLabel } from '../model/day-agenda';
import { DAY_AGENDA_VIEW_FILTERS, type DayAgendaViewFilter } from '../model/day-agenda-search';
import { DayAgendaTimeline, WeekAgendaTimeline } from './day-agenda-timeline';

const VIEW_LABELS: Record<DayAgendaViewFilter, MessageId> = {
  operational: 'dayAgendaFilterOperational',
  actionPending: 'dayAgendaFilterActionPending',
  allNonCancelled: 'dayAgendaFilterAllNonCancelled',
  pending: 'appointmentFilterPending',
  confirmed: 'appointmentFilterConfirmed',
  completed: 'appointmentFilterCompleted',
  rescheduled: 'appointmentStatusRescheduled',
  cancelled: 'appointmentFilterCancelled',
  no_show: 'appointmentFilterNoShow',
  all: 'appointmentFilterAll',
};

type Agenda = ReturnType<typeof useDayAgenda>;

/** `/schedule/day-agenda` (DayAgendaScreen): summary, period toolbar, filters, day/week timeline. */
export function DayAgendaScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const locale = intl.locale as DateLocale;
  const text = (id: MessageId, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
  const isCompact = useWindowNarrowerThan(900);
  const [pushTarget, setPushTarget] = useState<AppointmentItem | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const agenda = useDayAgenda({
    locale,
    isCompact,
    onSuccess: (message) => {
      showToast(text(message));
    },
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
    onTooEarly: (message) => {
      showErrorToast(text(message));
    },
  });

  const emptyMessage = agenda.hasActiveFilters
    ? text('dayAgendaEmptyFiltered')
    : agenda.layoutScope === 'week'
      ? text('dayAgendaEmptyWeek', { range: weekRangeLabel(agenda.day, locale) })
      : text('dayAgendaEmptyDay', { date: agenda.periodLabel });

  return (
    <>
      <ListPage
        title={text('dayAgendaTitle')}
        subtitle={text('dayAgendaSubtitle')}
        summaryLabel={text('adminSummaryTitle')}
        summary={agenda.showAppointments ? <AgendaSummary agenda={agenda} /> : undefined}
        toolbar={
          <DayAgendaToolbar
            agenda={agenda}
            onPickDay={() => {
              setDateOpen(true);
            }}
          />
        }
      >
        {agenda.selectedDayClosed && agenda.layoutScope === 'day' ? (
          <p className="mb-3 rounded-lg border border-warning-fg/30 bg-warning-bg px-3 py-2 text-sm font-semibold text-warning-fg">
            {text('dayAgendaClosedDayBanner')}
          </p>
        ) : null}

        {agenda.isError && agenda.isEmpty ? (
          <EmptyState
            icon="error_outline"
            title={text('dayAgendaLoadError')}
            message={describeFailure(agenda.error)}
            action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: agenda.retry }}
          />
        ) : agenda.isLoading && agenda.isEmpty ? (
          <div className="flex justify-center py-12">
            <Spinner size={36} className="text-primary" />
          </div>
        ) : agenda.isEmpty ? (
          <EmptyState icon="event_busy_outlined" title={text('dayAgendaTitle')} message={emptyMessage} />
        ) : agenda.layoutScope === 'week' ? (
          <WeekAgendaTimeline
            weekDays={agenda.weekDays}
            selectedDay={agenda.day}
            range={agenda.timelineRange}
            workingDays={agenda.workingDays}
            appointments={agenda.filteredAppointments}
            blockedSlots={agenda.blockedSlots}
            isCompact={isCompact}
            onDaySelected={(day) => {
              agenda.setDay(day);
              agenda.setScope('day');
            }}
            onAppointmentTap={agenda.openDetail}
            onCompleteTap={agenda.complete}
            onCustomerPushTap={setPushTarget}
            canComplete={agenda.canComplete}
            canPush={agenda.canPush}
          />
        ) : (
          <DayAgendaTimeline
            day={agenda.day}
            range={agenda.timelineRange}
            workingDays={agenda.workingDays}
            appointments={agenda.filteredAppointments}
            blockedSlots={agenda.blockedSlots}
            isCompact={isCompact}
            showNowIndicator={agenda.day === agenda.today}
            onAppointmentTap={agenda.openDetail}
            onCompleteTap={agenda.complete}
            onCustomerPushTap={setPushTarget}
            canComplete={agenda.canComplete}
            canPush={agenda.canPush}
          />
        )}
      </ListPage>

      {dateOpen ? (
        <DatePickerDialog
          day={agenda.day}
          today={agenda.today}
          onClose={() => {
            setDateOpen(false);
          }}
          onApply={(day) => {
            agenda.setDay(day);
            setDateOpen(false);
          }}
        />
      ) : null}

      <PromptDialog
        open={pushTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPushTarget(null);
        }}
        title={text('customerPushSendTitle')}
        message={text('customerPushSendBody')}
        fieldLabel={text('customerPushHint')}
        confirmLabel={text('customerPushSendConfirm')}
        cancelLabel={text('adminCommonCancel')}
        onConfirm={(body) => {
          if (pushTarget) agenda.sendPush(pushTarget, body);
          setPushTarget(null);
        }}
      />
    </>
  );
}

function AgendaSummary({ agenda }: { agenda: Agenda }) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const totalTitle = agenda.hasAppointmentFilters
    ? agenda.layoutScope === 'week'
      ? 'appointmentStatTotalWeek'
      : agenda.day === agenda.today
        ? 'appointmentStatTotalToday'
        : 'appointmentStatTotal'
    : agenda.layoutScope === 'week'
      ? 'appointmentStatTotalWeek'
      : agenda.day === agenda.today
        ? 'appointmentStatTotalToday'
        : 'appointmentStatTotal';
  const totalSubtitle = agenda.hasAppointmentFilters
    ? 'appointmentStatAccordingToFilters'
    : agenda.layoutScope === 'week'
      ? agenda.isCurrentPeriod
        ? 'appointmentStatWeekThis'
        : 'appointmentStatWeekSelected'
      : agenda.day === agenda.today
        ? 'appointmentStatScheduledToday'
        : 'appointmentStatScheduledDay';

  return (
    <SummaryGrid count={4}>
      <StatCard
        title={text(totalTitle)}
        value={String(agenda.summary.total)}
        subtitle={text(totalSubtitle)}
      />
      <StatCard
        title={text('appointmentFilterPending')}
        value={String(agenda.summary.pending)}
        subtitle={text('appointmentSummaryPendingSubtitle')}
      />
      <StatCard
        title={text('appointmentFilterCompleted')}
        value={String(agenda.summary.completed)}
        subtitle={text('appointmentSummaryCompletedSubtitle')}
      />
      <StatCard
        title={text('appointmentFilterCancelled')}
        value={String(agenda.summary.cancelled)}
        subtitle={text('appointmentSummaryCancelledSubtitle')}
      />
    </SummaryGrid>
  );
}

function DayAgendaToolbar({ agenda, onPickDay }: { agenda: Agenda; onPickDay: () => void }) {
  const intl = useIntl();
  const layout = useListLayout();
  const text = (id: MessageId, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
  const removeLabel = text('adminCommonClear');

  const prevLabel = agenda.layoutScope === 'week' ? text('dayAgendaPrevWeek') : text('dayAgendaPrevDay');
  const nextLabel = agenda.layoutScope === 'week' ? text('dayAgendaNextWeek') : text('dayAgendaNextDay');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="icon"
          aria-label={prevLabel}
          onClick={() => {
            agenda.shiftPeriod(-1);
          }}
        >
          <Icon name="chevron_left_rounded" />
        </Button>
        <Button variant="secondary" icon="calendar_today_outlined" onClick={onPickDay}>
          {agenda.periodLabel}
        </Button>
        <Button
          variant="icon"
          aria-label={nextLabel}
          onClick={() => {
            agenda.shiftPeriod(1);
          }}
        >
          <Icon name="chevron_right_rounded" />
        </Button>
        {!agenda.isCurrentPeriod ? (
          <Button
            variant="secondary"
            onClick={() => {
              agenda.goToday();
            }}
          >
            {agenda.layoutScope === 'week'
              ? text('dayAgendaThisWeekShortcut')
              : text('dayAgendaTodayShortcut')}
          </Button>
        ) : null}
        {!layout.compact ? (
          <div className="min-w-[220px] flex-1">
            <SegmentedTabs
              label={text('dayAgendaScopeDay')}
              value={agenda.urlScope}
              onValueChange={agenda.setScope}
              tabs={[
                { value: 'day', label: text('dayAgendaScopeDay'), icon: 'event_outlined' },
                { value: 'week', label: text('dayAgendaScopeWeek'), icon: 'calendar_view_week_outlined' },
              ]}
            />
          </div>
        ) : null}
        {agenda.showAppointments ? (
          <span className="text-sm font-semibold text-content-secondary">
            {text('dayAgendaCountAppointments', { count: agenda.summary.total })}
          </span>
        ) : null}
        {agenda.showBlockedSlots ? (
          <span className="text-sm font-semibold text-content-secondary">
            {text('dayAgendaCountBlockedSlots', { count: agenda.blockedSlots.length })}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={agenda.searchText}
          onValueChange={agenda.setSearchText}
          placeholder={text('dayAgendaSearchHint')}
          aria-label={text('dayAgendaSearchHint')}
          clearLabel={text('adminCommonClearSearch')}
          className={layout.compact ? 'w-full' : 'min-w-0 flex-1'}
        />
        <FilterPicker
          compact={layout.compact}
          trigger={
            <ToolbarField
              icon="tune_rounded"
              label={text(VIEW_LABELS[agenda.viewFilter])}
              className={layout.compact ? 'w-full' : 'w-[180px]'}
            />
          }
          title={text('dayAgendaViewFilterTitle')}
          subtitle={text('dayAgendaViewFilterSubtitle')}
          clearLabel={text('adminCommonClear')}
          applyLabel={text('adminCommonApply')}
          options={DAY_AGENDA_VIEW_FILTERS.map((value) => ({
            value,
            label: text(VIEW_LABELS[value]),
          }))}
          value={agenda.viewFilter}
          clearValue="all"
          onApply={agenda.setViewFilter}
        />
        {agenda.services.length > 1 ? (
          <FilterPicker
            compact={layout.compact}
            trigger={
              <ToolbarField
                icon="content_cut_outlined"
                label={
                  agenda.serviceId
                    ? (agenda.services.find((service) => service.id === agenda.serviceId)?.name ??
                      text('dayAgendaServiceFilterTitle'))
                    : text('dayAgendaServiceFilterTitle')
                }
                className={layout.compact ? 'w-full' : 'w-[180px]'}
              />
            }
            title={text('dayAgendaServiceFilterTitle')}
            subtitle={text('dayAgendaServiceFilterSubtitle')}
            clearLabel={text('adminCommonClear')}
            applyLabel={text('adminCommonApply')}
            options={[
              { value: '', label: text('dayAgendaAllServices') },
              ...agenda.services.map((service) => ({ value: service.id, label: service.name })),
            ]}
            value={agenda.serviceId ?? ''}
            clearValue=""
            onApply={(value) => {
              agenda.setServiceId(value === '' ? null : value);
            }}
          />
        ) : null}
      </div>

      <div className={layout.compact ? 'flex flex-wrap gap-1.5' : 'flex flex-wrap gap-2'}>
        <LayerToggle
          label={text('dayAgendaTabAppointments')}
          pressed={agenda.showAppointments}
          onPressedChange={agenda.setShowAppointments}
          dense={layout.compact}
        />
        <LayerToggle
          label={text('dayAgendaTabBlockedSlots')}
          pressed={agenda.showBlockedSlots}
          onPressedChange={agenda.setShowBlockedSlots}
          dense={layout.compact}
        />
        {agenda.viewFilter !== 'all' ? (
          <RemovableChip
            label={text(VIEW_LABELS[agenda.viewFilter])}
            removeLabel={removeLabel}
            dense={layout.compact}
            onRemove={() => {
              agenda.setViewFilter('all');
            }}
          />
        ) : null}
        {agenda.serviceId ? (
          <RemovableChip
            label={
              agenda.services.find((service) => service.id === agenda.serviceId)?.name ??
              text('dayAgendaServiceFilterTitle')
            }
            removeLabel={removeLabel}
            dense={layout.compact}
            onRemove={() => {
              agenda.setServiceId(null);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function LayerToggle({
  label,
  pressed,
  onPressedChange,
  dense = false,
}: {
  label: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  dense?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => {
        onPressedChange(!pressed);
      }}
      className={
        pressed
          ? dense
            ? 'rounded-pill border border-selection-border bg-selection-bg px-2.5 py-1 text-[12px] font-bold text-selection-fg'
            : 'rounded-pill border border-selection-border bg-selection-bg px-3 py-1.5 text-sm font-bold text-selection-fg'
          : dense
            ? 'rounded-pill border border-border bg-surface px-2.5 py-1 text-[12px] font-bold text-content-secondary'
            : 'rounded-pill border border-border bg-surface px-3 py-1.5 text-sm font-bold text-content-secondary'
      }
    >
      {label}
    </button>
  );
}

function DatePickerDialog({
  day,
  today,
  onClose,
  onApply,
}: {
  day: BusinessDay;
  today: BusinessDay;
  onClose: () => void;
  onApply: (day: BusinessDay) => void;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const [draft, setDraft] = useState(day);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={text('dayAgendaChooseDate')}
      message={text('dayAgendaClosedDayHint')}
      confirmLabel={text('dayAgendaApplyDate')}
      cancelLabel={text('adminCommonCancel')}
      tone="emphasized"
      onConfirm={() => {
        onApply(draft);
      }}
    >
      <DateInputField
        id="day-agenda-date"
        value={draft}
        onChange={setDraft}
        placeholder={text('dayAgendaChooseDate')}
        initialDay={today}
        first="2020-01-01"
        last={addDays(today, 365)}
        language={intl.locale as 'es' | 'ca' | 'en'}
        labels={{
          title: text('dayAgendaChooseDate'),
          subtitle: text('dayAgendaClosedDayHint'),
          apply: text('dayAgendaApplyDate'),
          cancel: text('adminCommonCancel'),
        }}
      />
    </ConfirmDialog>
  );
}
