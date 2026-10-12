import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Button } from '../primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../primitives/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../primitives/tooltip';

type AccentIconProps = { name: IconName; size?: number; compact?: boolean; className?: string };

/** AdminAccentIcon: an icon on a tinted tile (toolbar fields, section cards, filters). */
export function AccentIcon({ name, size = 18, compact = false, className }: AccentIconProps) {
  const box = compact ? size + 8 : size + 16;
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-icon-accent-bg text-icon-accent',
        compact ? 'rounded-sm' : 'rounded-[10px]',
        className,
      )}
      style={{ width: box, height: box }}
    >
      <Icon name={name} size={size} />
    </span>
  );
}

type SearchFieldProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
  clearLabel: string;
};

/**
 * AdminSearchField: 48px high, search icon in front and a clear button once there is text. Its
 * border is the content border, and the focus border the outline color, unlike form fields.
 */
export function SearchField({ value, onValueChange, clearLabel, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        className={cn(
          // Icon at 11px and text at 45px from the outer edge, as measured on the Flutter field.
          'h-12 w-full min-w-0 rounded-md border border-outline-variant bg-surface pr-12 pl-[43.5px]',
          'text-body-lg text-on-surface outline-none placeholder:text-on-surface-muted',
          'focus-visible:border-outline [&::-webkit-search-cancel-button]:hidden',
        )}
        {...props}
      />
      {value.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="icon"
              aria-label={clearLabel}
              onClick={() => {
                onValueChange('');
              }}
              className="absolute top-1/2 right-1 -translate-y-1/2"
            >
              <Icon name="close" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{clearLabel}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

type ToolbarFieldProps = ComponentProps<'button'> & { icon: IconName; label: string };

/** AdminToolbarField: a 48px field-like button with an accent icon, such as the filter. */
export function ToolbarField({ icon, label, className, ...props }: ToolbarFieldProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-12 min-w-0 cursor-pointer items-center gap-2.5 rounded-md border border-outline-variant bg-surface px-4 text-left',
        'hover:bg-[color-mix(in_srgb,var(--on-surface)_4%,var(--surface))]',
        className,
      )}
      {...props}
    >
      <AccentIcon name={icon} compact />
      <span className="min-w-0 flex-1 truncate font-bold text-on-surface">{label}</span>
    </button>
  );
}

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceChipsProps<T extends string> = {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

/** ChoiceChip group of the filter sheets: pill chips, the selected one filled, no checkmark. */
export function ChoiceChips<T extends string>({ label, options, value, onValueChange }: ChoiceChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              onValueChange(option.value);
            }}
            className={cn(
              'inline-flex h-8 cursor-pointer items-center rounded-pill border border-outline-variant px-4 text-body-md font-bold',
              selected ? 'border-on-surface bg-on-surface text-surface' : 'bg-surface text-on-surface',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type FilterPickerProps<T extends string> = {
  /** A sheet from the bottom on compact layouts, a panel under the trigger otherwise. */
  compact: boolean;
  trigger: ReactNode;
  title: string;
  subtitle: string;
  clearLabel: string;
  applyLabel: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  /** The value "Clear" applies. */
  clearValue: T;
  onApply: (value: T) => void;
  /** Called when the picker opens, for example to refresh its options. */
  onOpen?: () => void;
};

/**
 * The list filter (`_showServicesFilterSheet`): chips to choose from, then clear or apply. Flutter
 * opens a bottom sheet at every width; on wide layouts this opens a panel under the trigger.
 */
export function FilterPicker<T extends string>({
  compact,
  trigger,
  title,
  subtitle,
  clearLabel,
  applyLabel,
  options,
  value,
  clearValue,
  onApply,
  onOpen,
}: FilterPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSelected(value);
      onOpen?.();
    }
    setOpen(next);
  };
  const apply = (next: T) => {
    setOpen(false);
    onApply(next);
  };

  const chips = <ChoiceChips label={title} options={options} value={selected} onValueChange={setSelected} />;
  const actions = (
    <>
      <Button
        variant="secondary"
        icon="restart_alt_rounded"
        onClick={() => {
          apply(clearValue);
        }}
      >
        {clearLabel}
      </Button>
      <Button
        icon="check_rounded"
        onClick={() => {
          apply(selected);
        }}
      >
        {applyLabel}
      </Button>
    </>
  );

  if (compact) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent>
          <SheetBody>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{subtitle}</SheetDescription>
            </SheetHeader>
            {chips}
            <SheetFooter className="mt-6">{actions}</SheetFooter>
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="flex w-[420px] flex-col p-5">
        <p className="text-dialog-title font-black text-on-surface">{title}</p>
        <p className="mt-2 text-body-md leading-[1.5] text-content-secondary">{subtitle}</p>
        <div className="mt-5">{chips}</div>
        <div className="mt-6 flex gap-3 [&>*]:flex-1">{actions}</div>
      </PopoverContent>
    </Popover>
  );
}

type RemovableChipProps = {
  label: string;
  removeLabel: string;
  onRemove: () => void;
  /** Shorter chip for narrow toolbars (day agenda filters). */
  dense?: boolean;
};

/** The active filter beside the search, with a button that removes it. */
export function RemovableChip({ label, removeLabel, onRemove, dense = false }: RemovableChipProps) {
  return (
    <span
      className={
        dense
          ? 'inline-flex h-7 max-w-full items-center gap-0.5 rounded-pill border border-selection-border bg-selection-bg pr-0.5 pl-2.5 text-[12px] font-bold text-selection-fg'
          : 'inline-flex h-8 max-w-full items-center gap-1 rounded-pill border border-selection-border bg-selection-bg pr-1 pl-3 text-body-md font-bold text-selection-fg'
      }
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className={
          dense
            ? 'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-pill hover:bg-selection-fg/10'
            : 'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-pill hover:bg-selection-fg/10'
        }
      >
        <Icon name="close_rounded" size={dense ? 14 : 16} />
      </button>
    </span>
  );
}
