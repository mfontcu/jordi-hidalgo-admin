import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { paginationLabels } from '@/shared/i18n';
import {
  CardList,
  CardListItem,
  DataTable,
  EntityCard,
  Pagination,
  RefreshOverlay,
  StatusPill,
  TableAction,
  useListLayout,
  type DataTableColumn,
} from '@/shared/ui';

import {
  blockedSlotDate,
  blockedSlotType,
  blockedSlotVisibility,
  type BlockedSlot,
  type BlockedSlotPage,
} from '../../model/blocked-slot';
import { blockedSlotTimeText, localeOf, textOf } from '../shared/labels';

type RowsProps = {
  page: BlockedSlotPage;
  refreshing: boolean;
  onOpen: (slot: BlockedSlot) => void;
  onDelete: (slot: BlockedSlot) => void;
  onPageChange: (page: number) => void;
};

/** The blocks of the page: a table from 900px, cards under it. */
export function BlockedSlotsRows({ page, refreshing, onOpen, onDelete, onPageChange }: RowsProps) {
  const intl = useIntl();
  const { compact } = useListLayout();
  const pagination = (
    <Pagination
      page={page.page}
      pageSize={page.pageSize}
      totalItems={page.totalItems}
      labels={paginationLabels(intl)}
      onPageChange={onPageChange}
      embedded={!compact}
    />
  );

  return (
    <RefreshOverlay refreshing={refreshing}>
      {compact ? (
        <div className="flex flex-col">
          <CardList ids={page.items.map((slot) => slot.id)}>
            {page.items.map((slot) => (
              <CardListItem key={slot.id}>
                <BlockedSlotCard slot={slot} onOpen={onOpen} onDelete={onDelete} />
              </CardListItem>
            ))}
          </CardList>
          <div className="mt-7">{pagination}</div>
        </div>
      ) : (
        <BlockedSlotsTable slots={page.items} onOpen={onOpen} onDelete={onDelete} footer={pagination} />
      )}
    </RefreshOverlay>
  );
}

type TableProps = {
  slots: BlockedSlot[];
  onOpen: (slot: BlockedSlot) => void;
  onDelete: (slot: BlockedSlot) => void;
  footer: React.ReactNode;
};

/** BlockedSlotsTable: date, hours, type, web visibility, reason, and actions; resizable. */
function BlockedSlotsTable({ slots, onOpen, onDelete, footer }: TableProps) {
  const intl = useIntl();
  const columns = useMemo((): DataTableColumn<BlockedSlot>[] => {
    const text = textOf(intl);
    const locale = localeOf(intl);
    const secondary = (value: string) => (
      <span className="block truncate text-muted-foreground">{value}</span>
    );
    return [
      {
        id: 'date',
        header: text('appointmentFieldDate'),
        initialWidth: 150,
        minWidth: 120,
        grow: 2,
        cell: (slot) => (
          <span className="block truncate font-bold text-foreground">{blockedSlotDate(slot, locale)}</span>
        ),
      },
      {
        id: 'time',
        header: text('scheduleBlockedSlotTableSchedule'),
        initialWidth: 180,
        minWidth: 140,
        grow: 2,
        cell: (slot) => secondary(blockedSlotTimeText(intl, slot)),
      },
      {
        id: 'type',
        header: text('scheduleBlockedSlotTableType'),
        fixedWidth: 120,
        cell: (slot) => {
          const pill = blockedSlotType(slot);
          return <StatusPill label={text(pill.label)} tone={pill.tone} />;
        },
      },
      {
        id: 'webVisibility',
        header: text('scheduleBlockedSlotFormWebVisibilitySection'),
        fixedWidth: 140,
        cell: (slot) => {
          const pill = blockedSlotVisibility(slot);
          return <StatusPill label={text(pill.label)} tone={pill.tone} />;
        },
      },
      {
        id: 'reason',
        header: text('scheduleFieldReason'),
        initialWidth: 240,
        minWidth: 180,
        grow: 3,
        cell: (slot) => secondary(slot.reason),
      },
      {
        id: 'actions',
        header: text('appointmentTableActionsColumn'),
        fixedWidth: 132,
        align: 'center',
        interactive: true,
        cell: (slot) => (
          <span className="inline-flex gap-1">
            <TableAction
              icon="visibility_outlined"
              label={text('scheduleBlockedSlotViewTooltip')}
              onClick={() => {
                onOpen(slot);
              }}
            />
            <TableAction
              icon="delete_outline"
              tone="danger"
              label={text('scheduleBlockedSlotDeleteTooltip')}
              onClick={() => {
                onDelete(slot);
              }}
            />
          </span>
        ),
      },
    ];
  }, [intl, onOpen, onDelete]);

  return (
    <DataTable
      label={intl.formatMessage({ id: 'scheduleBlockedSlotsTitle' })}
      columns={columns}
      rows={slots}
      getRowId={(slot) => slot.id}
      onRowClick={onOpen}
      rowLabel={(slot) => blockedSlotDate(slot, localeOf(intl))}
      resizable
      footer={footer}
    />
  );
}

type CardProps = {
  slot: BlockedSlot;
  onOpen: (slot: BlockedSlot) => void;
  onDelete: (slot: BlockedSlot) => void;
};

/** BlockedSlotCard: the day and its type, the hours and reason, then view and delete. */
function BlockedSlotCard({ slot, onOpen, onDelete }: CardProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const type = blockedSlotType(slot);
  return (
    <EntityCard
      title={blockedSlotDate(slot, localeOf(intl))}
      status={<StatusPill label={text(type.label)} tone={type.tone} />}
      meta={[
        [text('scheduleBlockedSlotTableSchedule'), blockedSlotTimeText(intl, slot)],
        [text('scheduleFieldReason'), slot.reason],
      ]}
      labelWidth={72}
      onOpen={() => {
        onOpen(slot);
      }}
      actions={[
        {
          icon: 'visibility_outlined',
          label: text('scheduleActionView'),
          onClick: () => {
            onOpen(slot);
          },
        },
        {
          icon: 'delete_outline',
          label: text('adminCommonDelete'),
          tone: 'danger',
          onClick: () => {
            onDelete(slot);
          },
        },
      ]}
    />
  );
}
