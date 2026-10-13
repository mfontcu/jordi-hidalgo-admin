import { useRef, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';
import { Input } from '../primitives/input';
import { Popover, PopoverAnchor, PopoverContent } from '../primitives/popover';
import { FormField } from './sections';

type LookupFieldProps = {
  id: string;
  label: string;
  /** Text of the chosen option; empty when none is chosen. */
  value: string;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Clears the choice; without it the field shows only the open button. */
  onClear?: () => void;
  labels: { open: string; clear: string };
  error?: string;
  /** The options panel, usually a `LookupList`. */
  children: ReactNode;
};

/**
 * AdminLookupField: a read-only field that opens a panel of options under it. While a value is
 * chosen, its button clears it; otherwise the button (or the field) opens the panel.
 */
export function LookupField({
  id,
  label,
  value,
  placeholder,
  open,
  onOpenChange,
  onClear,
  labels,
  error,
  children,
}: LookupFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const toggle = () => {
    onOpenChange(!open);
  };
  const clear = value.trim().length > 0 ? onClear : undefined;
  return (
    <FormField id={id} label={label} error={error}>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <Input
              id={id}
              readOnly
              value={value}
              placeholder={placeholder}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={toggle}
              className="cursor-pointer pr-14"
            />
            {clear ? (
              <LookupButton icon="close_rounded" label={labels.clear} onClick={clear} />
            ) : (
              <LookupButton
                icon={open ? 'keyboard_arrow_up_rounded' : 'manage_search_rounded'}
                label={labels.open}
                onClick={toggle}
              />
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          sideOffset={8}
          className="w-(--radix-popover-trigger-width) p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
          // A click on the field toggles the panel itself; it is not a click outside.
          onInteractOutside={(event) => {
            if (event.target instanceof Node && anchorRef.current?.contains(event.target))
              event.preventDefault();
          }}
        >
          {children}
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

function LookupButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="absolute top-1/2 right-2 flex size-[34px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-card text-foreground"
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

export type LookupOption = { id: string; title: string; subtitle?: string };

type LookupListProps = {
  label: string;
  options: readonly LookupOption[];
  onSelect: (id: string) => void;
  /** Shown instead of the list when there are no options. */
  empty: string;
};

/** The options of a lookup (AdminServiceCategorySelectorPanel): title and code, at most 220px high. */
export function LookupList({ label, options, onSelect, empty }: LookupListProps) {
  if (options.length === 0) {
    return <p className="p-3 leading-[1.5] text-muted-foreground">{empty}</p>;
  }
  return (
    <ul aria-label={label} className="max-h-[220px] overflow-y-auto py-2">
      {options.map((option, index) => (
        <li key={option.id} className={cn(index > 0 && 'border-t border-border')}>
          <button
            type="button"
            onClick={() => {
              onSelect(option.id);
            }}
            className="flex w-full cursor-pointer flex-col px-4 py-2 text-left hover:bg-foreground/4"
          >
            <span className="font-bold text-foreground">{option.title}</span>
            {/* The title names the option; the subtitle (a code) would run into it unspaced. */}
            {option.subtitle && (
              <span aria-hidden className="text-[12px] text-muted-foreground">
                {option.subtitle}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
