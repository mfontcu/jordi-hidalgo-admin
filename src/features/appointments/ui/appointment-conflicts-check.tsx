import { useId } from 'react';
import { useIntl } from 'react-intl';

import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui';

import { useRangeConflicts, type ConflictHandlers, type ConflictRange } from '../hooks/use-range-conflicts';
import { conflictDetailsOf, conflictTitleOf } from '../model/appointment';

type AppointmentConflictsCheckProps = ConflictHandlers & {
  /** While set, the range is checked; clear it once resolved. */
  range: ConflictRange | null;
  /** The confirm button: "Create block", or "Save changes" for an edit. */
  confirmLabel: string;
};

/**
 * The appointments a blocked range would leave in the agenda (showBlockedSlotConflictDialog): when
 * some overlap, the dialog lists them, with a choice to cancel them, and goes on or back. With
 * none it goes on at once and shows nothing.
 */
export function AppointmentConflictsCheck({
  range,
  confirmLabel,
  ...handlers
}: AppointmentConflictsCheckProps) {
  const intl = useIntl();
  const checkboxId = useId();
  const check = useRangeConflicts(range, handlers);

  return (
    <Dialog
      open={check.open}
      onOpenChange={(open) => {
        if (!open) check.dismiss();
      }}
    >
      <DialogContent>
        <DialogTitle className="text-heading">
          {intl.formatMessage({ id: 'blockedSlotConflictTitle' })}
        </DialogTitle>
        <DialogDescription className="mt-3 text-body text-muted-foreground">
          {intl.formatMessage({ id: 'blockedSlotConflictBody' }, { count: check.conflicts.length })}
        </DialogDescription>
        <ul className="mt-3 max-h-64 divide-y divide-border overflow-y-auto">
          {check.conflicts.map((item) => (
            <li key={item.id} className="py-2">
              <p className="text-body-strong text-foreground">{conflictTitleOf(item)}</p>
              <p className="text-body text-muted-foreground">{conflictDetailsOf(item)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-label text-muted-foreground">
          {intl.formatMessage({ id: 'blockedSlotConflictKeepHint' })}
        </p>
        <div className="mt-3 flex items-center gap-4 py-2">
          <Checkbox
            id={checkboxId}
            checked={check.cancelChecked}
            onCheckedChange={(value) => {
              check.setCancelChecked(value === true);
            }}
          />
          <label htmlFor={checkboxId} className="cursor-pointer text-body text-foreground">
            {intl.formatMessage({ id: 'blockedSlotConflictCancelLabel' })}
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={check.dismiss}>
            {intl.formatMessage({ id: 'appointmentBulkCancelAction' })}
          </Button>
          <Button onClick={check.confirm}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
