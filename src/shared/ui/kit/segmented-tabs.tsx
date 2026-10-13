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
 * Equal tabs. The selected one is an underline in the foreground, weight 600.
 */
export function SegmentedTabs<T extends string>({
  label,
  tabs,
  value,
  onValueChange,
}: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex border-b border-border">
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
              'flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-body-strong',
              selected ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground',
            )}
          >
            <Icon name={tab.icon} size={20} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
