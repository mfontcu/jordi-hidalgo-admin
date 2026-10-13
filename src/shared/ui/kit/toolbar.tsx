import { useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Button } from '../primitives/button';
import { fieldBase } from '../primitives/field-styles';
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

/** Whether the window is narrower than `width`. */
export function useWindowNarrowerThan(width: number): boolean {
  const query = `(max-width: ${width - 0.02}px)`;
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    () => window.matchMedia(query).matches,
  );
}

type AccentIconProps = { name: IconName; size?: number; compact?: boolean; className?: string };

/** An icon on a selection wash, for toolbar fields and filter rows. */
export function AccentIcon({ name, size = 20, compact = false, className }: AccentIconProps) {
  const box = compact ? size + 8 : size + 12;
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-selection-wash text-foreground',
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

/** Search field: icon in front, and a clear button once there is text. */
export function SearchField({ value, onValueChange, clearLabel, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Icon
        name="search"
        size={20}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        className={cn(fieldBase, 'h-control pr-10 pl-10', '[&::-webkit-search-cancel-button]:hidden')}
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
              className="absolute top-1/2 right-0.5 size-8 -translate-y-1/2"
            >
              <Icon name="close" size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{clearLabel}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

type ToolbarFieldProps = ComponentProps<'button'> & { icon: IconName; label: string };

/** A field-like button with an accent icon, such as the filter trigger. */
export function ToolbarField({ icon, label, className, ...props }: ToolbarFieldProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-control min-w-0 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-left',
        'hover:bg-muted',
        className,
      )}
      {...props}
    >
      <AccentIcon name={icon} size={20} compact />
      <span className="min-w-0 flex-1 truncate text-body-strong text-foreground">{label}</span>
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

/** Options inside a filter: 6px radius, the selected one in the selection colors. */
export function ChoiceChips<T extends string>({ label, options, value, onValueChange }: ChoiceChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
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
              'inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-label',
              selected
                ? 'border-transparent bg-selection-wash text-selection'
                : 'border-border bg-card text-foreground hover:bg-muted',
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
  /**
   * Kept so current screens still type-check. The container follows the viewport: a sheet under
   * 768px, a popover from 768px.
   */
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
 * The list filter: chips to choose from, then clear or apply. Under 768px a sheet; from 768px a
 * popover. Both use the same actions.
 */
export function FilterPicker<T extends string>({
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
  const sheet = useWindowNarrowerThan(768);
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

  if (sheet) {
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
            <SheetFooter>{actions}</SheetFooter>
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col">
        <p className="text-heading text-foreground">{title}</p>
        <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>
        <div className="mt-4">{chips}</div>
        <div className="mt-4 flex justify-end gap-3">{actions}</div>
      </PopoverContent>
    </Popover>
  );
}

type RemovableChipProps = {
  label: string;
  removeLabel: string;
  onRemove: () => void;
  /** Shorter chip for narrow toolbars. */
  dense?: boolean;
};

/** The active filter beside the search, with a button that removes it. */
export function RemovableChip({ label, removeLabel, onRemove, dense = false }: RemovableChipProps) {
  return (
    <span
      className={
        dense
          ? 'inline-flex h-7 max-w-full items-center gap-0.5 rounded-md bg-selection-wash pr-0.5 pl-2 text-caption text-selection'
          : 'inline-flex h-8 max-w-full items-center gap-1 rounded-md bg-selection-wash pr-1 pl-2.5 text-label text-selection'
      }
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className={
          dense
            ? 'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-foreground/10'
            : 'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-foreground/10'
        }
      >
        <Icon name="close_rounded" size={20} />
      </button>
    </span>
  );
}
