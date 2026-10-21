import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  Checkbox,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  showErrorToast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';

import { useActivityBell } from '../hooks/use-activity-bell';
import { activityBadge } from '../model/notice';
import type { ActivityItem } from '../model/refresh';
import { ActivitySentence } from './activity-sentence';

type ActivityBellProps = {
  /** Sidebar row, or the icon on the mobile header. */
  placement: 'sidebar' | 'header';
  /** Icon only, as on the collapsed rail. */
  compact?: boolean;
};

/** Unread customer notices. Opening the list does not mark them. */
export function ActivityBell({ placement, compact = false }: ActivityBellProps) {
  const intl = useIntl();
  const describe = useDescribeFailure();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const bell = useActivityBell((error) => {
    showErrorToast(describe(error, 'activityMarkFailed'));
  });

  const countLabel = intl.formatMessage({ id: 'activityBellCount' }, { count: bell.items.length });
  const overflow = intl.formatMessage({ id: 'activityBellOverflow' });
  const badge = activityBadge(bell.items.length, overflow);
  const chosen = selected.filter((id) => bell.items.some((item) => item.id === id));

  const trigger = (
    <Button
      variant="icon"
      aria-label={countLabel}
      className={cn('relative', placement === 'sidebar' ? 'text-sidebar-muted' : 'text-foreground')}
    >
      <Icon name="notifications_none_outlined" size={20} />
      {badge && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-caption text-destructive-foreground">
          {badge}
        </span>
      )}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {compact || placement === 'header' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{countLabel}</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      )}
      <PopoverContent
        align={placement === 'header' ? 'end' : 'start'}
        side={placement === 'header' ? 'bottom' : 'right'}
        className="flex w-[320px] flex-col gap-3 p-3"
        aria-label={countLabel}
      >
        <div className="flex gap-2">
          <Button
            variant="text"
            className="min-h-0 flex-1 px-2 py-2 text-label"
            disabled={chosen.length === 0}
            onClick={() => {
              bell.markIds(chosen);
              setSelected([]);
            }}
          >
            {intl.formatMessage({ id: 'activityMarkSelected' })}
          </Button>
          <Button
            variant="text"
            className="min-h-0 flex-1 px-2 py-2 text-label"
            disabled={bell.items.length === 0}
            onClick={() => {
              bell.markAll();
              setSelected([]);
            }}
          >
            {intl.formatMessage({ id: 'activityMarkAll' })}
          </Button>
        </div>
        {bell.error ? (
          <div className="flex flex-col gap-2">
            <p className="text-body text-muted-foreground">{describe(bell.error)}</p>
            <Button variant="secondary" onClick={bell.retry}>
              {intl.formatMessage({ id: 'adminCommonRetry' })}
            </Button>
          </div>
        ) : bell.items.length === 0 ? (
          <p className="text-body text-muted-foreground">{intl.formatMessage({ id: 'activityBellEmpty' })}</p>
        ) : (
          <ul
            className="flex max-h-[360px] flex-col gap-1 overflow-y-auto"
            aria-label={intl.formatMessage({ id: 'activityBellLabel' })}
          >
            {bell.items.map((item) => (
              <ActivityRow
                key={item.id}
                item={item}
                serviceName={bell.serviceName(item.payload.serviceId)}
                selected={chosen.includes(item.id)}
                onSelect={(checked) => {
                  setSelected((current) =>
                    checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                  );
                }}
                onOpen={() => {
                  setOpen(false);
                  bell.open(item);
                }}
                onMark={() => {
                  bell.markOne(item.id);
                }}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ActivityRow({
  item,
  serviceName,
  selected,
  onSelect,
  onOpen,
  onMark,
}: {
  item: ActivityItem;
  serviceName: string | null;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
  onMark: () => void;
}) {
  const intl = useIntl();
  const trimmed = item.payload.customerName?.trim() ?? '';
  const name = trimmed.length > 0 ? trimmed : intl.formatMessage({ id: 'activityUnknownName' });
  return (
    <li className="flex items-start gap-1">
      <Checkbox
        checked={selected}
        aria-label={intl.formatMessage({ id: 'activitySelect' }, { name })}
        onCheckedChange={(checked) => {
          onSelect(checked === true);
        }}
        className="mt-2"
      />
      <Button
        variant="text"
        className="h-auto min-h-0 flex-1 whitespace-normal px-2 py-2 text-left text-body font-normal"
        onClick={onOpen}
      >
        <ActivitySentence item={item} serviceName={serviceName} />
      </Button>
      <Button
        variant="icon"
        aria-label={intl.formatMessage({ id: 'activityMarkOne' }, { name })}
        onClick={onMark}
        className="mt-1"
      >
        <Icon name="check_rounded" size={18} />
      </Button>
    </li>
  );
}
