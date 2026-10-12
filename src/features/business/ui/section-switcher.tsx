import { useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Icon, type IconName, useElementWidth } from '@/shared/ui';

import type { BusinessTab } from '../model/business-tab';
import { textOf } from './shared/labels';

const SECTIONS: {
  tab: BusinessTab;
  label:
    | 'businessSectionInfo'
    | 'businessSectionBooking'
    | 'businessSectionNotifications'
    | 'businessSectionLegal'
    | 'businessSectionWeb'
    | 'businessSectionGallery';
  icon: IconName;
}[] = [
  { tab: 'info', label: 'businessSectionInfo', icon: 'storefront_outlined' },
  { tab: 'booking', label: 'businessSectionBooking', icon: 'event_available_outlined' },
  { tab: 'notifications', label: 'businessSectionNotifications', icon: 'notifications_none_outlined' },
  { tab: 'legal', label: 'businessSectionLegal', icon: 'article_outlined' },
  { tab: 'web', label: 'businessSectionWeb', icon: 'language' },
  { tab: 'gallery', label: 'businessSectionGallery', icon: 'photo_library_outlined' },
];

type SectionSwitcherProps = {
  value: BusinessTab;
  onValueChange: (tab: BusinessTab) => void;
};

/**
 * Six section buttons like Flutter `BusinessSectionSwitcher`. Under 700px the row scrolls and
 * padding tightens; under 500px labels hide and the icon keeps the accessible name.
 */
export function SectionSwitcher({ value, onValueChange }: SectionSwitcherProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const [ref, width] = useElementWidth();
  const compact = (width ?? 1440) < 700;
  const iconsOnly = (width ?? 1440) < 500;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div
          role="tablist"
          aria-label={text('shellHeaderBusinessTitle')}
          className={cn('flex gap-2', compact && 'gap-1.5 overflow-x-auto pb-1')}
        >
          {SECTIONS.map((section) => {
            const selected = section.tab === value;
            const label = text(section.label);
            return (
              <button
                key={section.tab}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={label}
                title={label}
                onClick={() => {
                  onValueChange(section.tab);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-lg',
                  compact ? 'shrink-0 px-2.5 py-2.5' : 'min-w-0 flex-1 px-3.5 py-3',
                  selected
                    ? 'border border-selection-border bg-selection-bg text-selection-fg'
                    : 'border border-transparent text-on-surface hover:bg-[color-mix(in_srgb,var(--on-surface)_4%,var(--surface))]',
                )}
              >
                <Icon
                  name={section.icon}
                  size={20}
                  className={selected ? 'text-selection-fg' : 'text-icon-accent opacity-55'}
                />
                {!iconsOnly && (
                  <span
                    className={cn(
                      'truncate font-extrabold',
                      selected ? 'text-selection-fg' : 'text-on-surface',
                    )}
                  >
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
