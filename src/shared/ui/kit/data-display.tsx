import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Button } from '../primitives/button';
import { Spinner } from '../primitives/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../primitives/tooltip';
import { paginationRange, type PageInfo } from './pagination-range';
import { useElementWidth } from './use-element-width';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  /** Its icon defaults to add, as AdminEmptyState draws it; a retry uses refresh. */
  action?: { label: string; onClick: () => void; icon?: IconName };
};

/** AdminEmptyState: icon tile, title, message, and an optional action, centered on a card. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card p-7 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-4 text-heading text-foreground">{title}</p>
      <p className="mt-2 text-body text-muted-foreground">{message}</p>
      {action && (
        <Button icon={action.icon ?? 'add'} onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'neutralStrong' | 'muted' | 'info';

const TONES: Record<StatusTone, string> = {
  success: 'bg-success-wash text-success',
  danger: 'bg-destructive-wash text-destructive',
  warning: 'bg-warning-wash text-warning',
  neutral: 'bg-card text-muted-foreground',
  neutralStrong: 'bg-card text-foreground',
  /** The muted content color (contentMuted), such as a rescheduled appointment. */
  muted: 'bg-card text-muted-foreground',
  info: 'bg-selection-wash text-selection',
};

const PILL_SIZES = {
  default: 'px-2 py-1 text-caption',
  summary: 'px-2.5 py-1 text-label',
  large: 'px-3 py-1.5 text-caption',
};

type StatusPillProps = {
  label: string;
  tone: StatusTone;
  size?: keyof typeof PILL_SIZES;
  className?: string;
};

/** A status as a pill (AdminStatusPill). */
export function StatusPill({ label, tone, size = 'default', className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-block max-w-full truncate rounded-full align-top font-medium',
        TONES[tone],
        PILL_SIZES[size],
        className,
      )}
    >
      {label}
    </span>
  );
}

/**
 * AdminListRefreshOverlay: while a list reloads (page or filters), keeps the previous rows under a
 * veil with a spinner and blocks them until it ends.
 */
export function RefreshOverlay({ refreshing, children }: { refreshing: boolean; children: ReactNode }) {
  return (
    <div className="relative" aria-busy={refreshing || undefined}>
      {children}
      {refreshing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/72">
          <Spinner size={36} className="text-primary" />
        </div>
      )}
    </div>
  );
}

/** The color of a row action and its hover (AdminTableActionVariant, AdminInlineActionVariant). */
export type ActionTone = 'neutral' | 'success' | 'danger';

const ACTION_TONES: Record<ActionTone, string> = {
  neutral: 'text-muted-foreground hover:bg-card',
  success: 'text-success hover:bg-success-wash',
  danger: 'text-destructive hover:bg-destructive-wash',
};

type TableActionProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: IconName;
  label: string;
  tone?: ActionTone;
};

/** AdminTableAction: a small icon button with a tooltip, in a table's actions column. */
export function TableAction({ icon, label, tone = 'neutral', className, ...props }: TableActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'inline-flex cursor-pointer items-center rounded-sm px-0.5 py-1',
            ACTION_TONES[tone],
            className,
          )}
          {...props}
        >
          <Icon name={icon} size={20} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type InlineActionProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: IconName;
  label: string;
  compact?: boolean;
  tone?: ActionTone;
};

/** AdminInlineAction: icon and label for the actions of a card. */
export function InlineAction({
  icon,
  label,
  compact = false,
  tone = 'neutral',
  className,
  ...props
}: InlineActionProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md',
        compact ? 'px-2 py-1.5 text-label' : 'px-2.5 py-2 text-body-strong',
        ACTION_TONES[tone],
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={20} />
      {label}
    </button>
  );
}

export type PaginationLabels = {
  /** "Showing {start}–{end} of {total}", already formatted. */
  range: (start: number, end: number, total: number) => string;
  /** "Page {current} of {total}", already formatted. */
  page: (current: number, total: number) => string;
  previous: string;
  next: string;
};

type PaginationProps = PageInfo & {
  labels: PaginationLabels;
  onPageChange: (page: number) => void;
  /** Inside a table card: only a top border. Under a list of cards: a bordered card of its own. */
  embedded?: boolean;
};

/**
 * AdminListPaginationBar: the range shown and previous/next around the page number. Under 720px
 * the buttons lose their labels and the range goes above them.
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  labels,
  onPageChange,
  embedded = false,
}: PaginationProps) {
  const range = paginationRange({ page, pageSize, totalItems });
  const previous = () => {
    onPageChange(page - 1);
  };
  const next = () => {
    onPageChange(page + 1);
  };
  const [ref, width] = useElementWidth();
  // The bar's own width less its 16px padding on each side (LayoutBuilder inside the padding).
  const compact = width !== null && width - 32 < 720;
  const info = (
    <p className="text-center text-label text-muted-foreground">
      {labels.range(range.start, range.end, totalItems)}
    </p>
  );
  const indicator = (
    <span className="truncate rounded-md border border-border bg-muted px-3 py-2 text-center text-label text-foreground">
      {labels.page(page, range.totalPages)}
    </span>
  );

  return (
    <nav
      ref={ref}
      aria-label={labels.page(page, range.totalPages)}
      className={cn(
        'bg-card px-4 py-3',
        embedded ? 'border-t border-border' : 'rounded-lg border border-border',
      )}
    >
      {compact ? (
        <div className="flex flex-col gap-3">
          {info}
          <div className="flex items-center gap-2">
            <PageIconButton
              icon="chevron_left"
              label={labels.previous}
              disabled={!range.canGoPrevious}
              onClick={previous}
            />
            <div className="flex min-w-0 flex-1 justify-center">{indicator}</div>
            <PageIconButton
              icon="chevron_right"
              label={labels.next}
              disabled={!range.canGoNext}
              onClick={next}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4">
          {info}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon="chevron_left"
              disabled={!range.canGoPrevious}
              onClick={previous}
            >
              {labels.previous}
            </Button>
            {indicator}
            <Button variant="secondary" icon="chevron_right" disabled={!range.canGoNext} onClick={next}>
              {labels.next}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

type PageIconButtonProps = { icon: IconName; label: string; disabled: boolean; onClick: () => void };

function PageIconButton({ icon, label, disabled, onClick }: PageIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="min-h-10 min-w-11 px-2.5"
        >
          <Icon name={icon} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
