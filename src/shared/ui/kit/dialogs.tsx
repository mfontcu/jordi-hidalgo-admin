import { useBlocker } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Button } from '../primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog';
import { Spinner } from '../primitives/spinner';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  /** `danger` (the default of showAdminConfirmActionDialog) or `emphasized`. */
  tone?: 'danger' | 'emphasized';
};

/** showAdminConfirmActionDialog (AppConfirmDialog): title, message, cancel and confirm. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            // Confirm first: closing may also mean "cancel" to the caller (the unsaved-changes guard).
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type UnsavedChangesGuardProps = {
  /** Whether leaving now would lose changes. */
  when: boolean;
  labels: { title: string; message: string; keepEditing: string; discard: string };
};

/**
 * Asks before leaving a form with unsaved changes (showAdminDiscardUnsavedDialog): in-app
 * navigation waits for the answer, and closing or reloading the tab gets the browser's prompt.
 */
export function UnsavedChangesGuard({ when, labels }: UnsavedChangesGuardProps) {
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    enableBeforeUnload: () => when,
    withResolver: true,
  });
  return (
    <ConfirmDialog
      open={blocker.status === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.status === 'blocked') blocker.reset();
      }}
      title={labels.title}
      message={labels.message}
      cancelLabel={labels.keepEditing}
      confirmLabel={labels.discard}
      onConfirm={() => {
        if (blocker.status === 'blocked') blocker.proceed();
      }}
    />
  );
}

/**
 * adminShowRootLoadingBarrier: blocks the screen while a save runs, with a spinner and a message
 * on a raised card over a 45% black veil.
 */
export function LoadingBarrier({ message }: { message: ReactNode }) {
  return (
    <div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
      <div className="flex items-center gap-[18px] rounded-lg bg-surface px-7 py-[22px] shadow-m3-3">
        <Spinner size={28} className="text-primary" />
        <span className="text-[16px] font-extrabold text-on-surface">{message}</span>
      </div>
    </div>
  );
}
