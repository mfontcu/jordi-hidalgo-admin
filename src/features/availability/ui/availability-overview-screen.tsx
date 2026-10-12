import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { dateToDay, dayToDate, type DateLocale } from '@/shared/lib/business-time';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ListPage,
  LookupField,
  LookupList,
  SearchField,
  Spinner,
  StatCard,
  SummaryGrid,
  useWindowNarrowerThan,
} from '@/shared/ui';
import { Calendar } from '@/shared/ui/primitives/calendar';

import { useAvailabilityOverview } from '../hooks/use-availability-overview';
import type { AvailabilitySlot } from '../model/availability';

/** `/schedule/availability` (AvailabilityOverviewScreen). */
export function AvailabilityOverviewScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const locale = intl.locale as DateLocale;
  const text = (id: MessageId, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
  const isCompact = useWindowNarrowerThan(900);
  const [pendingSlot, setPendingSlot] = useState<AvailabilitySlot | null>(null);

  const overview = useAvailabilityOverview({
    locale,
    backLabel: text('availabilityBackToOverview'),
  });

  const contextSummary = overview.contextLine
    ? [
        overview.contextLine.dateSummary,
        overview.contextLine.duration,
        overview.contextLine.range
          ? text('availabilityContextFreeRange', overview.contextLine.range)
          : text('availabilityContextNoFreeSlots'),
      ].join(' · ')
    : null;

  return (
    <>
      <ListPage
        title={text('availabilityOverviewTitle')}
        subtitle={text('availabilityOverviewSubtitle')}
        summaryLabel={text('availabilitySummarySectionTitle')}
        summary={
          <SummaryGrid count={3}>
            <StatCard
              title={text('availabilitySummaryFreeSlotsTitle')}
              value={String(overview.summary.availableSlotCount)}
              subtitle={text('availabilitySummaryFreeSlotsSubtitle', {
                total: overview.summary.totalSlotCount,
              })}
            />
            <StatCard
              title={text('availabilitySummaryFreePercentTitle')}
              value={overview.summary.freePercentLabel}
              subtitle={text('availabilitySummaryFreePercentSubtitle')}
            />
            <StatCard
              title={text('availabilitySummaryBookableDaysTitle')}
              value={String(overview.summary.bookableDayCount)}
              subtitle={text('availabilitySummaryBookableDaysSubtitle')}
            />
          </SummaryGrid>
        }
        toolbar={
          <div className="flex flex-col gap-3">
            <div>
              <Button
                variant="secondary"
                icon="refresh"
                loading={overview.isLoading}
                onClick={() => {
                  void overview.refresh();
                }}
                disabled={!overview.selectedService}
              >
                {overview.isLoading ? text('availabilityRefreshing') : text('availabilityRefreshButton')}
              </Button>
            </div>
            {contextSummary ? (
              <p className="text-sm leading-[1.45] text-content-secondary">{contextSummary}</p>
            ) : null}
            <ServiceField overview={overview} />
          </div>
        }
      >
        {overview.error && overview.services.length === 0 ? (
          <EmptyState
            icon="error_outline"
            title={text('availabilityOverviewTitle')}
            message={describeFailure(overview.error)}
            action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: overview.retry }}
          />
        ) : overview.servicesLoading && overview.services.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner size={36} className="text-primary" />
          </div>
        ) : overview.services.length === 0 ? (
          <EmptyState
            icon="event_busy_outlined"
            title={text('availabilityOverviewTitle')}
            message={text('availabilityEmptyNoPublicServices')}
          />
        ) : !overview.selectedService ? (
          <EmptyState
            icon="event_outlined"
            title={text('availabilityOverviewTitle')}
            message={text('availabilityEmptySelectServiceForCalendar')}
          />
        ) : (
          <DayAndSlots
            overview={overview}
            isCompact={isCompact}
            onSlotTap={(slot) => {
              if (slot.isAvailable) setPendingSlot(slot);
            }}
          />
        )}
      </ListPage>

      {pendingSlot && overview.selectedService ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingSlot(null);
          }}
          title={text('availabilityCreateDialogTitle')}
          message={text('availabilityCreateDialogBody')}
          confirmLabel={text('availabilityCreateDialogConfirm')}
          cancelLabel={text('adminCommonCancel')}
          tone="emphasized"
          onConfirm={() => {
            overview.openCreateForSlot(pendingSlot);
            setPendingSlot(null);
          }}
        >
          <div className="flex flex-col gap-1.5 text-left">
            <p className="font-extrabold text-on-surface">{overview.selectedService.name}</p>
            <p className="text-content-secondary">{overview.contextLine?.dateSummary}</p>
            <p className="font-bold text-on-surface">
              {text('availabilityCreateDialogTime', { time: pendingSlot.time })}
            </p>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}

type Overview = ReturnType<typeof useAvailabilityOverview>;

function ServiceField({ overview }: { overview: Overview }) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });

  return (
    <LookupField
      id="availability-service"
      label={text('availabilityFieldService')}
      value={overview.selectedService?.name ?? ''}
      placeholder={text('availabilityFieldService')}
      open={overview.showServiceSelector}
      onOpenChange={overview.setShowServiceSelector}
      onClear={overview.selectedService ? overview.clearService : undefined}
      labels={{ open: text('availabilityFieldService'), clear: text('adminCommonClear') }}
    >
      <div className="border-b border-outline-variant p-3">
        <SearchField
          value={overview.serviceQuery}
          onValueChange={overview.setServiceQuery}
          placeholder={text('serviceSearchHint')}
          aria-label={text('serviceSearchHint')}
          clearLabel={text('adminCommonClearSearch')}
        />
      </div>
      <LookupList
        label={text('availabilityFieldService')}
        options={overview.filteredServices.map((service) => ({
          id: service.id,
          title: service.name,
          subtitle: service.categoryLabel || undefined,
        }))}
        onSelect={(id) => {
          const service = overview.filteredServices.find((item) => item.id === id);
          if (service) overview.selectService(service);
        }}
        empty={text('availabilityEmptyNoPublicServices')}
      />
    </LookupField>
  );
}

function DayAndSlots({
  overview,
  isCompact,
  onSlotTap,
}: {
  overview: Overview;
  isCompact: boolean;
  onSlotTap: (slot: AvailabilitySlot) => void;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });

  const calendar = (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="mb-2 text-sm font-extrabold text-on-surface">{text('availabilityFieldDay')}</p>
      {overview.bookableDays.length === 0 && !overview.isLoading ? (
        <p className="py-8 text-center text-content-secondary">{text('availabilityEmptyNoBookableDays')}</p>
      ) : (
        <Calendar
          mode="single"
          language={intl.locale as 'es' | 'ca' | 'en'}
          selected={dayToDate(overview.selectedDay)}
          onSelect={(date) => {
            if (!date) return;
            overview.setSelectedDay(dateToDay(date));
          }}
          disabled={(date) => {
            const day = dateToDay(date);
            if (day < overview.first || day > overview.last) return true;
            return !overview.isBookable(day);
          }}
          startMonth={dayToDate(overview.first)}
          endMonth={dayToDate(overview.last)}
        />
      )}
    </div>
  );

  const slots = (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-on-surface">{text('availabilityDaySlotsLabel')}</p>
        <div className="flex gap-3 text-xs font-bold">
          <span className="text-success-fg">{text('availabilityLegendAvailable')}</span>
          <span className="text-content-muted">{text('availabilityLegendUnavailable')}</span>
        </div>
      </div>
      {overview.isLoading && overview.slots.length === 0 ? (
        <div className="flex justify-center py-10">
          <Spinner size={32} className="text-primary" />
        </div>
      ) : overview.slots.length === 0 ? (
        <p className="py-8 text-center text-content-secondary">{text('availabilityEmptyNoSlotsForDay')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {overview.slots.map((slot) =>
            slot.isAvailable ? (
              <button
                key={slot.time}
                type="button"
                onClick={() => {
                  onSlotTap(slot);
                }}
                className="rounded-md border border-success-fg/30 bg-success-bg px-3 py-2 text-sm font-bold text-success-fg hover:bg-success-bg/80"
              >
                {slot.time}
              </button>
            ) : (
              <span
                key={slot.time}
                role="status"
                aria-label={[slot.time, text('availabilityLegendUnavailable')].join(' · ')}
                className="inline-flex items-center gap-1.5 rounded-md border border-outline/50 bg-surface-muted px-3 py-2 text-sm font-bold text-content-muted line-through decoration-content-muted/70"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-content-muted/70" aria-hidden />
                {slot.time}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );

  if (isCompact) {
    return (
      <div className="flex flex-col gap-4">
        {calendar}
        {slots}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(280px,360px)_minmax(0,1fr)] gap-4">
      {calendar}
      {slots}
    </div>
  );
}
