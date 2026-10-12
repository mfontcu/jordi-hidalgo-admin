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
              'inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-xs border text-label-lg disabled:cursor-not-allowed disabled:opacity-60',
              selected
                ? 'border-transparent bg-info-bg pr-4 pl-2 text-info-fg'
                : 'border-outline-variant bg-chip-surface px-4 text-on-surface-variant hover:bg-[color-mix(in_srgb,var(--on-surface-variant)_8%,var(--chip-surface))]',
            )}
          >
            {selected && <Icon name="check" size={18} />}
            {text(label)}
          </button>
        );
      })}
    </div>
  );
}
