import { cn } from '@/shared/lib/cn';

import { Icon, type IconName } from '../icons/icon';

export type SegmentedTab<T extends string> = { value: T; label: string; icon: IconName };

type SegmentedTabsProps<T extends string> = {
  label: string;
  tabs: readonly SegmentedTab<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

/**
 * `_BlockedSlotsSectionSwitcher`: equal tabs in a bordered bar; the selected one is filled with the
 * text color and its icon and label take the surface color.
 */
export function SegmentedTabs<T extends string>({
  label,
  tabs,
  value,
  onValueChange,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1.5 rounded-[18px] border border-outline-variant bg-surface p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              onValueChange(tab.value);
            }}
            className={cn(
              'flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-sm px-4 py-3.5',
              selected
                ? 'bg-on-surface text-surface'
                : 'text-on-surface hover:bg-[color-mix(in_srgb,var(--on-surface)_4%,var(--surface))]',
            )}
          >
            <Icon
              name={tab.icon}
              size={20}
              className={selected ? 'text-surface' : 'text-content-secondary'}
            />
            <span className="truncate font-extrabold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
