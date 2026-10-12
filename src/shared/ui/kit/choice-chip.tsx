import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import type { ChoiceOption } from './toolbar';

type SelectChipsProps<T extends string> = {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

/**
 * Material 3 ChoiceChips with the panel's theme (the recurring rule's weekdays): 8px corners, the
 * selected one filled in the info colors with a check and no border, the others outlined.
 */
export function SelectChips<T extends string>({ label, options, value, onValueChange }: SelectChipsProps<T>) {
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
              'inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-xs border text-label-lg',
              selected
                ? 'border-transparent bg-info-bg pr-4 pl-2 text-info-fg'
                : 'border-outline-variant bg-chip-surface px-4 text-on-surface-variant hover:bg-[color-mix(in_srgb,var(--on-surface-variant)_8%,var(--chip-surface))]',
            )}
          >
            {selected && <Icon name="check" size={18} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
