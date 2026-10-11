import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import type { IconName } from '../icons/icon';
import { Button } from '../primitives/button';
import { FieldError, Label } from '../primitives/field';
import { AccentIcon } from './toolbar';

type PageHeaderProps = {
  title: string;
  subtitle: string;
  /** Title size at the current layout (24, 28, or 30px in the Flutter detail and form specs). */
  titleSize: number;
  subtitleSize: number;
  back: { label: string; onClick: () => void };
  /**
   * Where the back button sits from 700px: at the start (a TextButton in a Column, the detail
   * screens and the service form) or centered (a TextButton alone in a ListView row, the user forms).
   */
  backAlign?: 'start' | 'center';
};

/**
 * Header of a detail or form screen (`_ServiceDetailHeader`): back button, title, and subtitle.
 * Under 700px the mobile header shows the title, so only the back button stays visible.
 */
export function PageHeader({
  title,
  subtitle,
  titleSize,
  subtitleSize,
  back,
  backAlign = 'start',
}: PageHeaderProps) {
  return (
    // Under 700px the back button spans the width, centered, as a TextButton alone in a ListView.
    <header className="flex flex-col items-start max-[699px]:items-stretch">
      <Button
        variant="text"
        icon="arrow_back_rounded"
        onClick={back.onClick}
        className={cn(backAlign === 'center' && 'self-center max-[699px]:self-stretch')}
      >
        {back.label}
      </Button>
      <div className="mt-2 max-[699px]:sr-only">
        <h1 className="font-black text-on-surface" style={{ fontSize: titleSize }}>
          {title}
        </h1>
        <p className="mt-2 leading-[1.5] text-content-secondary" style={{ fontSize: subtitleSize }}>
          {subtitle}
        </p>
      </div>
    </header>
  );
}

type InfoCardProps = {
  title: string;
  icon: IconName;
  children: ReactNode;
  className?: string;
  /**
   * `flat` (AdminInfoCard, detail screens): 20px padding, 20px icon, 18px title. `elevated`
   * (AdminSectionCard.elevated, the user forms): 24px radius and a soft shadow, 18px padding, a
   * compact 18px icon, 15px title.
   */
  variant?: 'flat' | 'elevated';
};

/** AdminSectionCard: a card with an accent icon and title over its content. */
export function InfoCard({ title, icon, children, className, variant = 'flat' }: InfoCardProps) {
  if (variant === 'elevated') {
    return (
      <section
        className={cn(
          'rounded-xl border border-outline-variant bg-surface p-[18px] shadow-[0_6px_14px_rgb(0_0_0/0.03)]',
          className,
        )}
      >
        <h2 className="flex items-center gap-2">
          <AccentIcon name={icon} size={18} compact />
          <span className="text-[15px] font-extrabold text-on-surface">{title}</span>
        </h2>
        <div className="mt-4">{children}</div>
      </section>
    );
  }
  return (
    <section className={cn('rounded-lg border border-border bg-surface p-5', className)}>
      <h2 className="flex items-center gap-3">
        <AccentIcon name={icon} size={20} />
        <span className="text-[18px] font-extrabold text-on-surface">{title}</span>
      </h2>
      <div className="mt-[18px]">{children}</div>
    </section>
  );
}

/** A summary card (`_ServiceSummaryCard`): 24px radius, content border, a soft shadow. */
export function SummaryCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface shadow-[0_6px_14px_rgb(0_0_0/0.03)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A tinted block inside a card (translations, editors, switches): muted surface, 16px radius. */
export function MutedPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-md bg-surface-muted p-4', className)}>{children}</div>;
}

/**
 * `_DetailRow`: label (130px) and value side by side; stacked when the row is narrower than 340px.
 */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="@container">
      <div className="flex items-start @max-[339px]:flex-col @max-[339px]:gap-1">
        <dt className="w-[130px] shrink-0 text-[13px] font-bold text-content-secondary @max-[339px]:w-auto">
          {label}
        </dt>
        <dd className="min-w-0 flex-1 text-[15px] leading-[1.4] [overflow-wrap:anywhere] text-on-surface">
          {value}
        </dd>
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
 * AdminActionGroup: primary and secondary side by side, then the danger action on its own row.
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

/** `_LabeledField`: bold label, 8px, the control, and its validation message. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      {hint && <p className="mt-1.5 text-[12px] leading-[1.4] text-content-secondary">{hint}</p>}
    </div>
  );
}
