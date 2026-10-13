import { cn } from '@/shared/lib/cn';

import { Icon } from '../icons/icon';
import type { ChoiceOption } from './toolbar';

type SelectChipsProps<T extends string> = {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

/** Single-choice chips: 6px radius, the selected one in the selection colors, with a check. */
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
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-label',
              selected
                ? 'border-transparent bg-selection-wash text-selection'
                : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            {selected && <Icon name="check" size={20} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
