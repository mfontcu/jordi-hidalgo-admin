import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { paginationLabels, useLocaleStore, type MessageId } from '@/shared/i18n';
import { formatClockTime, type DateLocale } from '@/shared/lib/business-time';
import {
  DataTable,
  EntityCard,
  Icon,
  Pagination,
  RefreshOverlay,
  StatusPill,
  TableAction,
  useElementWidth,
  useListLayout,
  type DataTableColumn,
} from '@/shared/ui';

import {
  clientName,
  datesLabel,
  expiresLabel,
  holdClock,
  isHeld,
  isUpgrade,
  serviceName,
  timeWindow,
  windowClock,
  type SlotWatch,
  type TimeWindow,
} from '../model/slot-watch';

type RowsProps = {
  rows: readonly SlotWatch[];
  page: number;
  pageSize: number;
  total: number;
  refreshing: boolean;
  isCancelling: (watchId: string) => boolean;
  onOpen: (watch: SlotWatch) => void;
  onClient: (watch: SlotWatch) => void;
  onCancel: (watch: SlotWatch) => void;
  onPageChange: (page: number) => void;
};

/** The page of watches: a table from 900px, cards under it. */
export function SlotWatchRows(props: RowsProps) {
  const intl = useIntl();
  const { compact } = useListLayout();
  const pagination = (
    <Pagination
      page={props.page}
      pageSize={props.pageSize}
      totalItems={props.total}
      labels={paginationLabels(intl)}
      onPageChange={props.onPageChange}
      embedded={!compact}
    />
  );

  return (
    <RefreshOverlay refreshing={props.refreshing}>
      {compact ? (
        <div className="flex flex-col">
          <ul className="flex flex-col gap-3">
            {props.rows.map((watch) => (
              <li key={watch.id}>
                <SlotWatchCard {...props} watch={watch} />
              </li>
            ))}
          </ul>
          <div className="mt-7">{pagination}</div>
        </div>
      ) : (
        <SlotWatchTable {...props} footer={pagination} />
      )}
    </RefreshOverlay>
  );
}

/** The status pill (SlotWatchStatusPill): info while waiting, warning while a slot is held. */
export function SlotWatchStatus({ watch }: { watch: SlotWatch }) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const clock = holdClock(watch);
  const label = clock
    ? intl.formatMessage({ id: 'slotWatchAdminHoldUntil' }, { time: formatClockTime(clock, locale, 'HH:mm') })
    : intl.formatMessage({ id: isHeld(watch) ? 'slotWatchAdminStatusHeld' : 'slotWatchAdminStatusActive' });
  return <StatusPill label={label} tone={isHeld(watch) ? 'warning' : 'info'} />;
}

function useWatchText() {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const anyTime = intl.formatMessage({ id: 'slotWatchAdminAnyTime' });
  return {
    locale,
    text: (id: MessageId) => intl.formatMessage({ id }),
    windowOf: (watch: SlotWatch) => windowText(timeWindow(watch), anyTime, locale),
    datesOf: (watch: SlotWatch) => datesLabel(watch.dates, locale),
  };
}

function windowText(window: TimeWindow, anyTime: string, locale: DateLocale): string {
  switch (window.kind) {
    case 'any':
      return anyTime;
    case 'range':
      return `${windowClock(window.from, locale)}–${windowClock(window.to, locale)}`;
    case 'from':
      return `${windowClock(window.from, locale)}+`;
    case 'until':
      return `–${windowClock(window.to, locale)}`;
  }
}

function ClientCell({ watch }: { watch: SlotWatch }) {
  const { text } = useWatchText();
  const name = clientName(watch);
  const email = watch.userDisplayName.trim() && watch.userEmail ? watch.userEmail : '';
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="min-w-0">
        <span className="block truncate font-bold text-foreground">{name}</span>
        {email && <span className="block truncate text-label text-muted-foreground">{email}</span>}
      </span>
      {isUpgrade(watch) && (
        <Icon
          name="upgrade_rounded"
          size={18}
          label={text('slotWatchAdminUpgrade')}
          className="text-selection"
        />
      )}
    </span>
  );
}

type TableProps = RowsProps & { footer: React.ReactNode };

function SlotWatchTable({ rows, isCancelling, onOpen, onClient, onCancel, footer }: TableProps) {
  const { text, windowOf, datesOf, locale } = useWatchText();
  const [ref, width] = useElementWidth();
  const wide = (width ?? 0) >= 1200;

  const columns = useMemo((): DataTableColumn<SlotWatch>[] => {
    const secondary = (value: string) => (
      <span className="block truncate text-muted-foreground">{value}</span>
    );
    const windowColumn: DataTableColumn<SlotWatch> = {
      id: 'window',
      header: text('slotWatchAdminColumnWindow'),
      initialWidth: 200,
      minWidth: 150,
      grow: 3,
      cell: (watch) => (
        <span className="block min-w-0">
          <span className="block truncate text-foreground">{datesOf(watch)}</span>
          <span className="block truncate text-label text-muted-foreground">{windowOf(watch)}</span>
        </span>
      ),
    };
    const actions: DataTableColumn<SlotWatch> = {
      id: 'actions',
      header: text('appointmentTableActionsColumn'),
      fixedWidth: 140,
      align: 'center',
      interactive: true,
      cell: (watch) => (
        <span className="inline-flex gap-1">
          <TableAction
            icon="visibility_outlined"
            label={text('slotWatchAdminViewTooltip')}
            onClick={() => {
              onOpen(watch);
            }}
          />
          <TableAction
            icon="person_outline"
            label={text('slotWatchAdminClientTooltip')}
            disabled={!watch.userId}
            onClick={() => {
              onClient(watch);
            }}
          />
          <TableAction
            icon="notifications_off_outlined"
            label={text('slotWatchAdminCancelTooltip')}
            tone="danger"
            disabled={isCancelling(watch.id)}
            onClick={() => {
              onCancel(watch);
            }}
          />
        </span>
      ),
    };
    const base: DataTableColumn<SlotWatch>[] = [
      {
        id: 'client',
        header: text('slotWatchAdminColumnClient'),
        initialWidth: 220,
        minWidth: 180,
        grow: 3,
        cell: (watch) => <ClientCell watch={watch} />,
      },
      {
        id: 'service',
        header: text('slotWatchAdminColumnService'),
        initialWidth: 160,
        minWidth: 120,
        grow: 2,
        cell: (watch) => <span className="block truncate text-foreground">{serviceName(watch)}</span>,
      },
      windowColumn,
      {
        id: 'status',
        header: text('slotWatchAdminColumnStatus'),
        fixedWidth: 160,
        cell: (watch) => <SlotWatchStatus watch={watch} />,
      },
    ];
    if (!wide) return [...base, actions];
    return [
      ...base,
      {
        id: 'notified',
        header: text('slotWatchAdminColumnNotified'),
        fixedWidth: 130,
        align: 'center',
        cell: (watch) => <span className="font-bold text-foreground">{watch.notifyCount}</span>,
      },
      {
        id: 'expires',
        header: text('slotWatchAdminColumnExpires'),
        fixedWidth: 100,
        cell: (watch) => secondary(expiresLabel(watch.expiresAt, locale)),
      },
      actions,
    ];
  }, [datesOf, isCancelling, locale, onCancel, onClient, onOpen, text, wide, windowOf]);

  return (
    <div ref={ref}>
      <DataTable
        label={text('slotWatchAdminTitle')}
        columns={columns}
        rows={rows}
        getRowId={(watch) => watch.id}
        onRowClick={onOpen}
        rowLabel={(watch) => clientName(watch)}
        resizable
        footer={footer}
      />
    </div>
  );
}

function SlotWatchCard({
  watch,
  isCancelling,
  onOpen,
  onClient,
  onCancel,
}: RowsProps & { watch: SlotWatch }) {
  const { text, windowOf, datesOf, locale } = useWatchText();
  const email = watch.userDisplayName.trim() && watch.userEmail ? watch.userEmail : undefined;
  const actions = [
    {
      icon: 'visibility_outlined' as const,
      label: text('slotWatchAdminViewTooltip'),
      onClick: () => {
        onOpen(watch);
      },
    },
    ...(watch.userId
      ? [
          {
            icon: 'person_outline' as const,
            label: text('slotWatchAdminViewClient'),
            onClick: () => {
              onClient(watch);
            },
          },
        ]
      : []),
    {
      icon: 'notifications_off_outlined' as const,
      label: text('slotWatchAdminCancelTooltip'),
      tone: 'danger' as const,
      onClick: () => {
        if (!isCancelling(watch.id)) onCancel(watch);
      },
    },
  ];
  return (
    <EntityCard
      title={clientName(watch)}
      subtitle={email}
      status={<SlotWatchStatus watch={watch} />}
      note={
        isUpgrade(watch) ? (
          <span className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <Icon name="upgrade_rounded" size={18} className="text-selection" />
            {text('slotWatchAdminUpgrade')}
          </span>
        ) : undefined
      }
      meta={[
        [text('slotWatchAdminColumnService'), serviceName(watch)],
        [text('slotWatchAdminDetailDates'), datesOf(watch)],
        [text('slotWatchAdminDetailTimeWindow'), windowOf(watch)],
        [text('slotWatchAdminColumnNotified'), String(watch.notifyCount)],
        [text('slotWatchAdminColumnExpires'), expiresLabel(watch.expiresAt, locale)],
      ]}
      onOpen={() => {
        onOpen(watch);
      }}
      actions={actions}
    />
  );
}
