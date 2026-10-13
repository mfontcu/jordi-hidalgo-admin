import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import {
  Card,
  CollapsibleSummary,
  ConfirmDialog,
  EmptyState,
  Icon,
  showErrorToast,
  Spinner,
  StatCard,
  StatusPill,
  Switch,
  useElementWidth,
} from '@/shared/ui';

import { useWorkingHours, type ShiftTarget } from '../../hooks/use-working-hours';
import { shiftRange, type ShiftSlot, type WorkingDay, type WorkingHours } from '../../model/working-hours';
import { textOf } from '../shared/labels';
import { ShiftEditor } from './shift-editor';

/** Working-hours density by the screen's content width. */
function layoutFor(width: number) {
  if (width < 640) {
    return {
      padding: 16,
      gap: 20,
      gapLarge: 24,
      summaryColumns: 1,
      cardHeight: 132,
      compact: true,
      columns: 1,
    };
  }
  if (width < 980) {
    return {
      padding: 20,
      gap: 22,
      gapLarge: 26,
      summaryColumns: 2,
      cardHeight: 136,
      compact: true,
      columns: 2,
    };
  }
  if (width < 1400) {
    return {
      padding: 24,
      gap: 24,
      gapLarge: 28,
      summaryColumns: 4,
      cardHeight: 136,
      compact: false,
      columns: 2,
    };
  }
  return {
    padding: 24,
    gap: 24,
    gapLarge: 28,
    summaryColumns: 4,
    cardHeight: 140,
    compact: false,
    columns: 3,
  };
}

type Layout = ReturnType<typeof layoutFor>;
type Hours = ReturnType<typeof useWorkingHours>;

/** `/schedule/working-hours` (WorkingHoursScreen): the summary and a card per weekday. */
export function WorkingHoursScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const hours = useWorkingHours({
    onError: (error, context) => {
      showErrorToast(describeFailure(error, context));
    },
  });
  const [ref, width] = useElementWidth();
  const layout = layoutFor(width ?? 1440);

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          {/* Under 768px the mobile header shows the title. */}
          <header className="max-[767px]:sr-only" style={{ marginBottom: layout.gap }}>
            <h1 className="text-title text-foreground">{text('scheduleWorkingHoursTitle')}</h1>
            <p className="mt-2 text-body text-muted-foreground">{text('scheduleWorkingHoursSubtitle')}</p>
          </header>
          {hours.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size={36} className="text-primary" />
            </div>
          ) : hours.error || !hours.hours ? (
            <EmptyState
              icon="error_outline"
              title={text('scheduleWorkingHoursLoadError')}
              message={describeFailure(hours.error)}
              action={{ label: text('adminCommonRetry'), icon: 'refresh', onClick: hours.retry }}
            />
          ) : (
            <>
              {layout.compact ? (
                <CollapsibleSummary label={text('adminSummaryTitle')}>
                  <Summary hours={hours.hours} layout={layout} />
                </CollapsibleSummary>
              ) : (
                <Summary hours={hours.hours} layout={layout} />
              )}
              <div
                className="grid gap-4"
                style={{
                  marginTop: layout.gapLarge,
                  gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                  gridAutoRows: layout.columns === 1 ? undefined : layout.columns === 3 ? 300 : 320,
                }}
              >
                {hours.hours.days.map((day) => (
                  <DayCard key={day.weekday} day={day} hours={hours} compact={layout.compact} />
                ))}
              </div>
            </>
          )}
          <DeleteShiftDialog hours={hours} />
        </div>
      )}
    </div>
  );
}

function Summary({ hours, layout }: { hours: WorkingHours; layout: Layout }) {
  const intl = useIntl();
  const text = textOf(intl);
  const card = (key: 'ActiveDays' | 'WeekendDays' | 'UsualOpening' | 'UsualClosing', value: string) => (
    <StatCard
      title={text(`scheduleSummary${key}Title`)}
      value={value}
      subtitle={text(`scheduleSummary${key}Subtitle`)}
    />
  );
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${layout.summaryColumns}, minmax(0, 1fr))`,
        gridAutoRows: layout.cardHeight,
      }}
    >
      {card('ActiveDays', String(hours.summary.activeDays))}
      {card('WeekendDays', String(hours.summary.activeWeekendDays))}
      {card('UsualOpening', hours.summary.usualOpening ?? '—')}
      {card('UsualClosing', hours.summary.usualClosing ?? '—')}
    </div>
  );
}

type DayCardProps = { day: WorkingDay; hours: Hours; compact: boolean };

/** WorkingDayCard: the day, its switch and status, and its two shifts, or why it has none. */
function DayCard({ day, hours, compact }: DayCardProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const active = hours.isDayActive(day);
  return (
    <Card className="p-4">
      <div className="flex items-start">
        <h2 className="min-w-0 flex-1 text-heading text-foreground">{day.label}</h2>
        <Switch
          checked={active}
          aria-label={day.label}
          onCheckedChange={(checked) => {
            hours.setDayActive(day, checked);
          }}
        />
      </div>
      <StatusPill
        className="mt-2"
        label={text(active ? 'scheduleStatusActive' : 'scheduleStatusInactive')}
        tone={active ? 'success' : 'neutral'}
      />
      <div className="mt-3.5 flex flex-col gap-2.5">
        {active ? (
          (['morning', 'afternoon'] as const).map((slot) => (
            <ShiftBlock key={slot} day={day} slot={slot} hours={hours} compact={compact} />
          ))
        ) : (
          <p className="rounded-md bg-card p-3.5 text-body text-muted-foreground">
            {text('scheduleDayDisabledHint')}
          </p>
        )}
      </div>
    </Card>
  );
}

type ShiftBlockProps = { day: WorkingDay; slot: ShiftSlot; hours: Hours; compact: boolean };

/** `_TimeRangeBlock`: the shift's name and hours, edit, and delete when the day has that shift. */
function ShiftBlock({ day, slot, hours, compact }: ShiftBlockProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const shift = day[slot];
  const target: ShiftTarget = { weekday: day.weekday, slot };
  const editing = hours.editing?.weekday === day.weekday && hours.editing.slot === slot;

  const edit = (
    <button
      type="button"
      onClick={() => {
        hours.edit(target);
      }}
      className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-body-strong text-foreground hover:bg-muted"
    >
      <Icon name="edit_outlined" size={20} />
      {text('scheduleActionEdit')}
    </button>
  );

  return (
    <div className="flex items-center gap-3 rounded-md bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-label text-muted-foreground">
          {text(slot === 'morning' ? 'scheduleShiftMorning' : 'scheduleShiftAfternoon')}
        </p>
        <p className="mt-1 text-body-strong text-foreground">
          {shift ? shiftRange(shift) : text('scheduleNotDefined')}
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-1.5">
        <ShiftEditor
          day={day}
          slot={slot}
          compact={compact}
          open={editing}
          trigger={edit}
          onOpenChange={(open) => {
            if (open) hours.edit(target);
            else hours.closeEditor();
          }}
          onSave={(start, end) => {
            hours.save(target, start, end);
          }}
          onDelete={() => {
            hours.askDelete(target);
          }}
        />
        {shift && (
          <button
            type="button"
            onClick={() => {
              hours.askDelete(target);
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-body-strong text-destructive hover:bg-muted"
          >
            <Icon name="delete_outline" size={20} />
            {text('adminCommonDelete')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Deleting a shift asks first; Flutter deletes it at once (approved change). */
function DeleteShiftDialog({ hours }: { hours: Hours }) {
  const intl = useIntl();
  const text = textOf(intl);
  const deleting = hours.deleting;
  const shift = deleting?.day?.[deleting.slot] ?? null;
  return (
    <ConfirmDialog
      open={deleting !== null && shift !== null}
      onOpenChange={(open) => {
        if (!open) hours.cancelDelete();
      }}
      title={text('scheduleDeleteShift')}
      message={
        deleting && shift
          ? intl.formatMessage(
              { id: 'scheduleShiftDeleteMessage' },
              { shift: deleting.slot, day: deleting.day?.label ?? '', range: shiftRange(shift) },
            )
          : ''
      }
      cancelLabel={text('adminCommonCancel')}
      confirmLabel={text('adminCommonDelete')}
      onConfirm={hours.confirmDelete}
    />
  );
}
