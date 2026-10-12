import { useMemo } from 'react';
import { useIntl, type IntlShape } from 'react-intl';

import { paginationLabels, type MessageId } from '@/shared/i18n';
import { formatInstantDateTime, type DateLocale } from '@/shared/lib/business-time';
import {
  Avatar,
  Checkbox,
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
  isBulkSelectable,
  messagePreviewOf,
  rowActionsOf,
  statusLabelOf,
  statusToneOf,
  type AppointmentItem,
  type AppointmentPage,
} from '../model/appointment';

export type AppointmentRowHandlers = {
  open: (appointmentId: string) => void;
  complete: (item: AppointmentItem) => void;
  markNoShow: (item: AppointmentItem) => void;
  cancel: (item: AppointmentItem) => void;
};

type AppointmentsRowsProps = {
  page: AppointmentPage;
  refreshing: boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onPageChange: (page: number) => void;
  actions: AppointmentRowHandlers;
};

/** Appointments list body: table from the list breakpoint, cards below it. */
export function AppointmentsRows({
  page,
  refreshing,
  selectMode,
  selectedIds,
  onToggleSelected,
  onPageChange,
  actions,
}: AppointmentsRowsProps) {
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
          <ul className="flex flex-col gap-3">
            {page.items.map((item) => (
              <li key={item.id}>
                <AppointmentCard
                  item={item}
                  selectMode={selectMode}
                  selected={selectedIds.has(item.id)}
                  onToggleSelected={onToggleSelected}
                  actions={actions}
                />
              </li>
            ))}
          </ul>
          <div className="mt-7">{pagination}</div>
        </div>
      ) : (
        <AppointmentsTable
          items={page.items}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelected={onToggleSelected}
          actions={actions}
          footer={pagination}
        />
      )}
    </RefreshOverlay>
  );
}

function statusLabel(intl: IntlShape, status: string): string {
  const id = statusLabelOf(status);
  return id ? intl.formatMessage({ id }) : status;
}

function timeLabel(intl: IntlShape, item: AppointmentItem): string {
  return formatInstantDateTime(item.start, intl.locale as DateLocale, 'numericDate', 'HH:mm');
}

function customerNameOf(intl: IntlShape, item: AppointmentItem): string {
  return item.customerName.trim() || intl.formatMessage({ id: 'appointmentNoClient' });
}

type TableProps = {
  items: AppointmentItem[];
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  actions: AppointmentRowHandlers;
  footer: React.ReactNode;
};

function AppointmentsTable({
  items,
  selectMode,
  selectedIds,
  onToggleSelected,
  actions,
  footer,
}: TableProps) {
  const intl = useIntl();

  const columns = useMemo((): DataTableColumn<AppointmentItem>[] => {
    const text = (id: MessageId) => intl.formatMessage({ id });
    const secondary = (value: string) => (
      <span className="block truncate text-content-secondary">{value}</span>
    );

    const selectCol: DataTableColumn<AppointmentItem> | null = selectMode
      ? {
          id: 'select',
          header: '',
          fixedWidth: 48,
          align: 'center',
          interactive: true,
          cell: (item) => {
            const selectable = isBulkSelectable(item.status);
            return (
              <Checkbox
                aria-label={customerNameOf(intl, item)}
                disabled={!selectable}
                checked={selectable && selectedIds.has(item.id)}
                onCheckedChange={() => {
                  if (selectable) onToggleSelected(item.id);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              />
            );
          },
        }
      : null;

    const cols: DataTableColumn<AppointmentItem>[] = [
      {
        id: 'time',
        header: text('appointmentTimeColumnLabel'),
        initialWidth: 170,
        minWidth: 150,
        grow: 2,
        cell: (item) => (
          <span className="block truncate font-extrabold text-on-surface">{timeLabel(intl, item)}</span>
        ),
      },
      {
        id: 'client',
        header: text('appointmentSectionClient'),
        initialWidth: 220,
        minWidth: 170,
        grow: 3,
        cell: (item) => (
          <span className="flex items-center gap-2.5">
            {item.userId && (
              <Avatar src={item.customerAvatarUrl} size={32} viewLabel={text('adminUserViewPhoto')} />
            )}
            <span className="min-w-0 flex-1 truncate font-bold text-on-surface">
              {customerNameOf(intl, item)}
            </span>
          </span>
        ),
      },
      {
        id: 'service',
        header: text('appointmentSectionService'),
        initialWidth: 220,
        minWidth: 170,
        grow: 3,
        cell: (item) => secondary(item.serviceName),
      },
      {
        id: 'message',
        header: text('appointmentTableMessageColumn'),
        initialWidth: 240,
        minWidth: 160,
        grow: 4,
        cell: (item) => {
          const message = item.customerNotes.trim();
          return message ? (
            <span title={message} className="line-clamp-2 leading-[1.35] text-on-surface">
              {messagePreviewOf(message)}
            </span>
          ) : (
            <span className="text-content-secondary">{messagePreviewOf(message)}</span>
          );
        },
      },
      {
        id: 'status',
        header: text('appointmentTableStatusColumn'),
        fixedWidth: 130,
        cell: (item) => (
          <StatusPill label={statusLabel(intl, item.status)} tone={statusToneOf(item.status)} />
        ),
      },
    ];

    if (!selectMode) {
      cols.push({
        id: 'actions',
        header: text('appointmentTableActionsColumn'),
        fixedWidth: 176,
        align: 'center',
        interactive: true,
        cell: (item) => {
          const allowed = rowActionsOf(item);
          return (
            <span className="flex flex-wrap justify-center gap-1">
              <TableAction
                icon="visibility_outlined"
                label={text('appointmentCardView')}
                onClick={() => {
                  actions.open(item.id);
                }}
              />
              {allowed.completeOrNoShow && (
                <>
                  <TableAction
                    icon="check_circle_outline"
                    tone="success"
                    label={text('dayAgendaTooltipComplete')}
                    onClick={() => {
                      actions.complete(item);
                    }}
                  />
                  <TableAction
                    icon="person_off_outlined"
                    label={text('appointmentStatusNoShow')}
                    onClick={() => {
                      actions.markNoShow(item);
                    }}
                  />
                </>
              )}
              {allowed.cancel && (
                <TableAction
                  icon="cancel_outlined"
                  tone="danger"
                  label={text('appointmentCancelButton')}
                  onClick={() => {
                    actions.cancel(item);
                  }}
                />
              )}
            </span>
          );
        },
      });
    }

    return selectCol ? [selectCol, ...cols] : cols;
  }, [intl, selectMode, selectedIds, onToggleSelected, actions]);

  return (
    <DataTable
      label={intl.formatMessage({ id: 'appointmentListTitle' })}
      columns={columns}
      rows={items}
      getRowId={(item) => item.id}
      onRowClick={
        selectMode
          ? (item) => {
              if (isBulkSelectable(item.status)) onToggleSelected(item.id);
            }
          : (item) => {
              actions.open(item.id);
            }
      }
      rowLabel={(item) => `${timeLabel(intl, item)} · ${item.serviceName}`}
      resizable={!selectMode}
      footer={footer}
    />
  );
}

type CardProps = {
  item: AppointmentItem;
  selectMode: boolean;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  actions: AppointmentRowHandlers;
};

function AppointmentCard({ item, selectMode, selected, onToggleSelected, actions }: CardProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const allowed = rowActionsOf(item);
  const message = item.customerNotes.trim();
  const name = customerNameOf(intl, item);
  const selectable = isBulkSelectable(item.status);
  const open = () => {
    actions.open(item.id);
  };

  return (
    <EntityCard
      title={name}
      leading={
        selectMode ? (
          <Checkbox
            aria-label={name}
            disabled={!selectable}
            checked={selectable && selected}
            onCheckedChange={() => {
              if (selectable) onToggleSelected(item.id);
            }}
          />
        ) : item.userId ? (
          <Avatar src={item.customerAvatarUrl} size={44} viewLabel={text('adminUserViewPhoto')} />
        ) : null
      }
      status={<StatusPill label={statusLabel(intl, item.status)} tone={statusToneOf(item.status)} />}
      labelWidth={72}
      clampValues
      meta={[
        [text('appointmentFieldDate'), timeLabel(intl, item)],
        [text('appointmentSectionService'), item.serviceName],
        ...(message ? [[text('appointmentTableMessageColumn'), message] as const] : []),
      ]}
      onOpen={
        selectMode
          ? () => {
              if (selectable) onToggleSelected(item.id);
            }
          : open
      }
      actions={
        selectMode
          ? []
          : [
              { icon: 'visibility_outlined', label: text('appointmentCardView'), onClick: open },
              ...(allowed.completeOrNoShow
                ? [
                    {
                      icon: 'check_circle_outline' as const,
                      label: text('appointmentCardComplete'),
                      tone: 'success' as const,
                      onClick: () => {
                        actions.complete(item);
                      },
                    },
                    {
                      icon: 'person_off_outlined' as const,
                      label: text('appointmentStatusNoShow'),
                      onClick: () => {
                        actions.markNoShow(item);
                      },
                    },
                  ]
                : []),
              ...(allowed.cancel
                ? [
                    {
                      icon: 'cancel_outlined' as const,
                      label: text('appointmentCardCancel'),
                      tone: 'danger' as const,
                      onClick: () => {
                        actions.cancel(item);
                      },
                    },
                  ]
                : []),
            ]
      }
    />
  );
}
