import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import type { IconName } from '../icons/icon';
import { Button } from '../primitives/button';
import { FieldError, Label } from '../primitives/field';
import { AccentIcon } from './toolbar';

type PageHeaderProps = {
  title: string;
  subtitle: string;
  /** Kept so current screens still type-check. The heading uses the title step. */
  titleSize?: number;
  /** Kept so current screens still type-check. The subtitle uses the body step. */
  subtitleSize?: number;
  back: { label: string; onClick: () => void };
  /**
   * Where the back button sits from 768px: at the start (detail screens) or centered (user forms).
   */
  backAlign?: 'start' | 'center';
};

/**
 * Header of a detail or form screen: back button, title, and subtitle. Under 768px the mobile
 * header shows the title, so only the back button stays visible.
 */
export function PageHeader({ title, subtitle, back, backAlign = 'start' }: PageHeaderProps) {
  return (
    // Not a landmark: the shell already owns the page banner. Under 768px the back button
    // spans the width, centered.
    <div className="flex flex-col items-start max-[767px]:items-stretch">
      <Button
        variant="text"
        icon="arrow_back_rounded"
        onClick={back.onClick}
        className={cn(backAlign === 'center' && 'self-center max-[767px]:self-stretch')}
      >
        {back.label}
      </Button>
      <div className="mt-2 max-[767px]:sr-only">
        <h1 className="text-title text-foreground">{title}</h1>
        <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

type InfoCardProps = {
  title: string;
  icon: IconName;
  children: ReactNode;
  className?: string;
  /** `flat` for detail screens. `elevated` for the user forms: a compact icon and title. */
  variant?: 'flat' | 'elevated';
};

/** A card with an accent icon and title over its content. */
export function InfoCard({ title, icon, children, className, variant = 'flat' }: InfoCardProps) {
  if (variant === 'elevated') {
    return (
      <section className={cn('rounded-lg border border-border bg-card p-4', className)}>
        <h2 className="flex items-center gap-2">
          <AccentIcon name={icon} size={20} compact />
          <span className="text-body-strong text-foreground">{title}</span>
        </h2>
        <div className="mt-4">{children}</div>
      </section>
    );
  }
  return (
    <section className={cn('rounded-lg border border-border bg-card p-5', className)}>
      <h2 className="flex items-center gap-3">
        <AccentIcon name={icon} size={20} />
        <span className="text-heading text-foreground">{title}</span>
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A summary card on a detail screen. */
export function SummaryCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border border-border bg-card', className)}>{children}</div>;
}

/** A muted block inside a card. */
export function MutedPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-md bg-muted p-4', className)}>{children}</div>;
}

type DetailRowProps = {
  label: string;
  value: string;
  /** The label column: 130px, or 110px for a narrower row. */
  labelWidth?: number;
  /** Kept so current screens still type-check. The value uses the body step. */
  valueSize?: 14 | 15;
};

/** Label and value side by side; stacked when the row is narrower than 340px. */
export function DetailRow({ label, value, labelWidth = 130 }: DetailRowProps) {
  return (
    <div className="@container">
      <div className="flex items-start @max-[339px]:flex-col @max-[339px]:gap-1">
        <dt
          className="w-(--label-width) shrink-0 text-label text-muted-foreground @max-[339px]:w-auto"
          style={{ '--label-width': `${labelWidth}px` } as CSSProperties}
        >
          {label}
        </dt>
        <dd className="min-w-0 flex-1 text-body [overflow-wrap:anywhere] text-foreground">{value}</dd>
      </div>
    </div>
  );
}

type ActionGroupAction = { label: string; icon: IconName; onClick: () => void };

type ActionGroupProps = {
  primary: ActionGroupAction & { loading?: boolean };
  secondary?: ActionGroupAction;
  danger?: ActionGroupAction;
};

/**
 * Primary and secondary side by side, then the danger action on its own row.
 * Under 420px each button takes a full row.
 */
export function ActionGroup({ primary, secondary, danger }: ActionGroupProps) {
  return (
    <div className="@container">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 @max-[419px]:flex-col [&>*]:flex-1">
          <Button icon={primary.icon} loading={primary.loading} onClick={primary.onClick}>
            {primary.label}
          </Button>
          {secondary && (
            <Button variant="secondary" icon={secondary.icon} onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
        </div>
        {danger && (
          <Button variant="danger" icon={danger.icon} onClick={danger.onClick}>
            {danger.label}
          </Button>
        )}
      </div>
    </div>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  /** Text under the field, such as how a value is used. */
  hint?: string;
  children: ReactNode;
};

/** Label, the control, and its validation message. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      {hint && <p className="mt-1.5 text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}
