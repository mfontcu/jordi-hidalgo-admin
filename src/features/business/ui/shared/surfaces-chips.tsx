import { useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';

import type { PublicSurface } from '../../model/locales';
import { textOf } from './labels';

type SurfacesChipsProps = {
  value: readonly PublicSurface[];
  onChange: (surface: PublicSurface, enabled: boolean) => void;
  disabled?: boolean;
};

const OPTIONS: { surface: PublicSurface; label: 'legalVisibilityApp' | 'legalVisibilityWeb' }[] = [
  { surface: 'app', label: 'legalVisibilityApp' },
  { surface: 'web', label: 'legalVisibilityWeb' },
];

/** App / web visibility chips (toggle independently; at least one must stay on). */
export function SurfacesChips({ value, onChange, disabled = false }: SurfacesChipsProps) {
  const intl = useIntl();
  const text = textOf(intl);
  return (
    <div role="group" aria-label={text('legalVisibilityHeading')} className="flex flex-wrap gap-2">
      {OPTIONS.map(({ surface, label }) => {
        const selected = value.includes(surface);
        return (
          <button
            key={surface}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => {
              onChange(surface, !selected);
            }}
            className={cn(
              'inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border text-body disabled:cursor-not-allowed disabled:opacity-60',
              selected
                ? 'border-transparent bg-selection-wash pr-4 pl-2 text-selection'
                : 'border-border bg-card px-4 text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--card))]',
            )}
          >
            {selected && <Icon name="check" size={20} />}
            {text(label)}
          </button>
        );
      })}
    </div>
  );
}
