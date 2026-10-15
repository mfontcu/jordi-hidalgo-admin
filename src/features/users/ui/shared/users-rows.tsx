import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { paginationLabels, type MessageId } from '@/shared/i18n';
import {
  Avatar,
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
  type StatusTone,
} from '@/shared/ui';

import { fullNameOf, orDash, type AdminUser, type AdminUserPage } from '../../model/admin-user';

/** A role-specific column after phone and email (AdminUsersListTable extra columns). */
export type UserExtraColumn = { header: string; value: (user: AdminUser) => string };

type UsersRowsProps = {
  page: AdminUserPage;
  refreshing: boolean;
  /** Header of the name column ("Administrador", "Cliente"). */
  nameHeader: string;
  /** One column for staff (registration), two for clients (last and next appointment). */
  extraColumns: readonly UserExtraColumn[];
  status: (user: AdminUser) => { label: MessageId; tone: StatusTone };
  /** The name of a row: staff show the name in the app, clients the alias first. Empty is "No name". */
  nameOf?: (user: AdminUser) => string;
  onOpen: (userId: string) => void;
  onPageChange: (page: number) => void;
};

/**
 * The accounts of a users list (AdminUsersListTable, AdminUserEntityCard): a table from 900px,
 * cards under it (AdminListPageLayoutSpec.useTable).
 */
export function UsersRows({
  page,
  refreshing,
  nameHeader,
  extraColumns,
  status,
  nameOf = fullNameOf,
  onOpen,
  onPageChange,
}: UsersRowsProps) {
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
          <CardList ids={page.items.map((user) => user.id)}>
            {page.items.map((user) => (
              <CardListItem key={user.id}>
                <UserCard
                  user={user}
                  extraColumns={extraColumns}
                  status={status}
                  nameOf={nameOf}
                  onOpen={onOpen}
                />
              </CardListItem>
            ))}
          </CardList>
          <div className="mt-7">{pagination}</div>
        </div>
      ) : (
        <UsersTable
          users={page.items}
          nameHeader={nameHeader}
          extraColumns={extraColumns}
          status={status}
          nameOf={nameOf}
          onOpen={onOpen}
          footer={pagination}
        />
      )}
    </RefreshOverlay>
  );
}

type UsersTableProps = Pick<UsersRowsProps, 'nameHeader' | 'extraColumns' | 'status' | 'onOpen'> & {
  nameOf: (user: AdminUser) => string;
  users: AdminUser[];
  footer: React.ReactNode;
};

/** AdminUsersListTable: resizable columns, the avatar beside the name, and a view action. */
function UsersTable({ users, nameHeader, extraColumns, status, nameOf, onOpen, footer }: UsersTableProps) {
  const intl = useIntl();

  const columns = useMemo((): DataTableColumn<AdminUser>[] => {
    const text = (id: MessageId) => intl.formatMessage({ id });
    const secondary = (value: string) => (
      <span className="block truncate text-muted-foreground">{value}</span>
    );
    // The widths of the extra columns, in order (`extra_a`, `extra_b`).
    const extraWidths = [
      { initialWidth: 150, minWidth: 120 },
      { initialWidth: 170, minWidth: 130 },
    ];
    return [
      {
        id: 'name',
        header: nameHeader,
        initialWidth: 220,
        minWidth: 170,
        grow: 3,
        cell: (user) => (
          <span className="flex items-center gap-2.5">
            <Avatar src={user.avatarUrl} size={36} viewLabel={text('adminUserViewPhoto')} />
            <span className="min-w-0 flex-1 truncate font-bold text-foreground">
              {nameOf(user) || text('adminUserUnnamed')}
            </span>
          </span>
        ),
      },
      {
        id: 'phone',
        header: text('appointmentFieldPhone'),
        initialWidth: 160,
        minWidth: 130,
        grow: 2,
        cell: (user) => secondary(orDash(user.phone)),
      },
      {
        id: 'email',
        header: text('appointmentFieldEmail'),
        initialWidth: 220,
        minWidth: 170,
        grow: 3,
        cell: (user) => secondary(orDash(user.email)),
      },
      ...extraColumns.map((column, index): DataTableColumn<AdminUser> => ({
        id: `extra-${index}`,
        header: column.header,
        ...(extraWidths[index] ?? { initialWidth: 150, minWidth: 120 }),
        grow: 2,
        cell: (user) => secondary(column.value(user)),
      })),
      {
        id: 'status',
        header: text('appointmentTableStatusColumn'),
        fixedWidth: 110,
        cell: (user) => {
          const pill = status(user);
          return <StatusPill label={text(pill.label)} tone={pill.tone} />;
        },
      },
      {
        id: 'actions',
        header: text('appointmentTableActionsColumn'),
        fixedWidth: 132,
        align: 'center',
        interactive: true,
        cell: (user) => (
          <TableAction
            icon="visibility_outlined"
            label={text('adminCommonViewDetail')}
            onClick={() => {
              onOpen(user.id);
            }}
          />
        ),
      },
    ];
  }, [intl, nameHeader, extraColumns, status, nameOf, onOpen]);

  return (
    <DataTable
      label={nameHeader}
      columns={columns}
      rows={users}
      getRowId={(user) => user.id}
      onRowClick={(user) => {
        onOpen(user.id);
      }}
      rowLabel={(user) => nameOf(user) || intl.formatMessage({ id: 'adminUserUnnamed' })}
      resizable
      footer={footer}
    />
  );
}

type UserCardProps = Pick<UsersRowsProps, 'extraColumns' | 'status' | 'onOpen'> & {
  user: AdminUser;
  nameOf: (user: AdminUser) => string;
};

/** AdminUserEntityCard: avatar, name, and status, then phone, email, and the extra columns. */
function UserCard({ user, extraColumns, status, nameOf, onOpen }: UserCardProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const pill = status(user);
  const open = () => {
    onOpen(user.id);
  };
  return (
    <EntityCard
      title={nameOf(user) || text('adminUserUnnamed')}
      leading={<Avatar src={user.avatarUrl} size={44} viewLabel={text('adminUserViewPhoto')} />}
      status={<StatusPill label={text(pill.label)} tone={pill.tone} />}
      meta={[
        [text('appointmentFieldPhone'), orDash(user.phone)],
        [text('appointmentFieldEmail'), orDash(user.email)],
        ...extraColumns.map((column) => [column.header, column.value(user)] as const),
      ]}
      onOpen={open}
      actions={[{ icon: 'visibility_outlined', label: text('adminCommonView'), onClick: open }]}
    />
  );
}
