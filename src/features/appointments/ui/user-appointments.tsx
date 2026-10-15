import { useMemo, useState } from 'react';
import { useIntl, type IntlShape } from 'react-intl';

import { paginationLabels, useDescribeFailure, type MessageId } from '@/shared/i18n';
import { formatInstantDateTime, type DateLocale } from '@/shared/lib/business-time';
import {
  Avatar,
  CardList,
  CardListItem,
  ConfirmDialog,
  DataTable,
  EmptyState,
  EntityCard,
  MutedPanel,
  Pagination,
  RefreshOverlay,
  showErrorToast,
  showToast,
  Spinner,
  StatusPill,
  TableAction,
  type DataTableColumn,
} from '@/shared/ui';

import { useUserAppointments } from '../hooks/use-user-appointments';
import {
  messagePreviewOf,
  rowActionsOf,
  statusLabelOf,
  statusToneOf,
  type AppointmentItem,
} from '../model/appointment';

type UserAppointmentsProps = {
  userId: string;
  /** The section title, which names the table. */
  label: string;
  /** The name every row shows: the client's display name, or the staff member's name. */
  customerName: string;
  /** When the account has no appointments (clientAppointmentsEmpty, staffAppointmentsEmpty). */
  emptyMessage: string;
  /** A table from 960px (AdminUserDetailLayoutSpec.useAppointmentsTable), cards under it. */
  useTable: boolean;
  /** After a status change, so the detail refreshes the account's counts. */
  onChanged: () => void;
};

/**
 * The appointments section of a client or staff detail (`_ClientAppointmentsContent`): the
 * account's appointments with view, complete, no-show, and cancel, ten per page.
 */
export function UserAppointments({
  userId,
  label,
  customerName,
  emptyMessage,
  useTable,
  onChanged,
}: UserAppointmentsProps) {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const [cancelling, setCancelling] = useState<AppointmentItem | null>(null);
  const list = useUserAppointments({
    userId,
    onChanged,
    onSuccess: (message) => showToast(intl.formatMessage({ id: message })),
    onError: (error, context) => showErrorToast(describeFailure(error, context)),
    onTooEarly: (message) => showErrorToast(intl.formatMessage({ id: message })),
  });
  const page = list.page;

  if (list.isLoading) {
    return (
      <div className="flex justify-center py-7">
        <Spinner size={36} className="text-primary" />
      </div>
    );
  }
  if (list.error || !page) {
    return (
      <EmptyState
        icon="error_outline"
        title={intl.formatMessage({ id: 'appointmentListLoadError' })}
        message={describeFailure(list.error)}
        action={{
          label: intl.formatMessage({ id: 'adminCommonRetry' }),
          icon: 'refresh',
          onClick: list.retry,
        }}
      />
    );
  }
  if (page.items.length === 0) {
    // `_ClientAppointmentsEmptyState`: the message on the muted surface, 18px padding.
    return (
      <MutedPanel className="p-4">
        <p className="text-body text-muted-foreground">{emptyMessage}</p>
      </MutedPanel>
    );
  }

  const actions: RowHandlers = {
    open: list.open,
    complete: list.complete,
    markNoShow: list.markNoShow,
    cancel: setCancelling,
  };
  const pagination = (
    <Pagination
      page={page.page}
      pageSize={page.pageSize}
      totalItems={page.totalItems}
      labels={paginationLabels(intl)}
      onPageChange={list.goToPage}
      embedded={useTable}
    />
  );

  return (
    <>
      <RefreshOverlay refreshing={list.isRefreshing || list.isBusy}>
        {useTable ? (
          <AppointmentsTable
            label={label}
            items={page.items}
            customerName={customerName}
            actions={actions}
            footer={pagination}
          />
        ) : (
          <div className="flex flex-col">
            <CardList ids={page.items.map((item) => item.id)}>
              {page.items.map((item) => (
                <CardListItem key={item.id}>
                  <AppointmentCard item={item} customerName={customerName} actions={actions} />
                </CardListItem>
              ))}
            </CardList>
            <div className="mt-4">{pagination}</div>
          </div>
        )}
      </RefreshOverlay>
      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title={intl.formatMessage({ id: 'appointmentCancelTitle' })}
        message={intl.formatMessage({ id: 'appointmentCancelBody' })}
        confirmLabel={intl.formatMessage({ id: 'appointmentCancelConfirm' })}
        cancelLabel={intl.formatMessage({ id: 'adminCommonCancel' })}
        onConfirm={() => {
          if (cancelling) list.cancel(cancelling);
        }}
      />
    </>
  );
}

type RowHandlers = {
  open: (appointmentId: string) => void;
  complete: (item: AppointmentItem) => void;
  markNoShow: (item: AppointmentItem) => void;
  cancel: (item: AppointmentItem) => void;
};

function statusLabel(intl: IntlShape, status: string): string {
  const id = statusLabelOf(status);
  return id ? intl.formatMessage({ id }) : status;
}

/** The time of a row: app_api's "dd/MM/yyyy · HH:mm" label, in salon time. */
function timeLabel(intl: IntlShape, item: AppointmentItem): string {
  return formatInstantDateTime(item.start, intl.locale as DateLocale, 'numericDate', 'HH:mm');
}

type TableProps = {
  label: string;
  items: AppointmentItem[];
  customerName: string;
  actions: RowHandlers;
  footer: React.ReactNode;
};

/** AppointmentsTable: time, client, service, message, status, and the row actions. */
function AppointmentsTable({ label, items, customerName, actions, footer }: TableProps) {
  const intl = useIntl();

  const columns = useMemo((): DataTableColumn<AppointmentItem>[] => {
    const text = (id: MessageId) => intl.formatMessage({ id });
    return [
      {
        id: 'time',
        header: text('appointmentTimeColumnLabel'),
        initialWidth: 170,
        minWidth: 150,
        grow: 2,
        cell: (item) => (
          <span className="block truncate text-body-strong text-foreground">{timeLabel(intl, item)}</span>
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
            <span className="min-w-0 flex-1 truncate font-bold text-foreground">{customerName}</span>
          </span>
        ),
      },
      {
        id: 'service',
        header: text('appointmentSectionService'),
        initialWidth: 220,
        minWidth: 170,
        grow: 3,
        cell: (item) => <span className="block truncate text-muted-foreground">{item.serviceName}</span>,
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
            <span title={message} className="line-clamp-2 text-body text-foreground">
              {messagePreviewOf(message)}
            </span>
          ) : (
            <span className="text-muted-foreground">{messagePreviewOf(message)}</span>
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
      {
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
      },
    ];
  }, [intl, customerName, actions]);

  return (
    <DataTable
      label={label}
      columns={columns}
      rows={items}
      getRowId={(item) => item.id}
      onRowClick={(item) => {
        actions.open(item.id);
      }}
      rowLabel={(item) => `${timeLabel(intl, item)} · ${item.serviceName}`}
      resizable
      footer={footer}
    />
  );
}

type CardProps = { item: AppointmentItem; customerName: string; actions: RowHandlers };

/** AdminAppointmentCard: client and status, date, service, and message, then the actions. */
function AppointmentCard({ item, customerName, actions }: CardProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const allowed = rowActionsOf(item);
  const message = item.customerNotes.trim();
  const open = () => {
    actions.open(item.id);
  };
  return (
    <EntityCard
      title={customerName}
      leading={
        item.userId ? (
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
      onOpen={open}
      actions={[
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
      ]}
    />
  );
}
