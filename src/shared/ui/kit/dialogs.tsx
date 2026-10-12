import { useBlocker } from '@tanstack/react-router';
import { useId, useState, type ReactNode } from 'react';

import { Button } from '../primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog';
import { Label } from '../primitives/field';
import { Spinner } from '../primitives/spinner';
import { Textarea } from '../primitives/textarea';

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
  /** AppConfirmDialog's `content`, 16px under the message. */
  children?: ReactNode;
  /** AppConfirmDialog's `confirmEnabled: false`. */
  confirmDisabled?: boolean;
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
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {children && <div className="mt-4">{children}</div>}
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
            disabled={confirmDisabled}
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

type PromptDialogProps = Omit<ConfirmDialogProps, 'onConfirm' | 'children' | 'confirmDisabled'> & {
  fieldLabel: string;
  fieldHint?: string;
  /** Receives the trimmed text, which is never empty. */
  onConfirm: (text: string) => void;
};

/**
 * showAdminTextInputConfirmDialog: a confirmation with a three-line text field; confirming needs
 * some text. The field starts empty each time the dialog opens.
 */
export function PromptDialog({
  open,
  onOpenChange,
  fieldLabel,
  fieldHint,
  onConfirm,
  ...props
}: PromptDialogProps) {
  const [text, setText] = useState('');
  const id = useId();
  return (
    <ConfirmDialog
      {...props}
      open={open}
      onOpenChange={(next) => {
        if (!next) setText('');
        onOpenChange(next);
      }}
      confirmDisabled={text.trim() === ''}
      onConfirm={() => {
        onConfirm(text.trim());
      }}
    >
      <div className="flex flex-col">
        <Label htmlFor={id} className="mb-2">
          {fieldLabel}
        </Label>
        <Textarea
          id={id}
          rows={3}
          className="resize-none"
          placeholder={fieldHint}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </div>
    </ConfirmDialog>
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
