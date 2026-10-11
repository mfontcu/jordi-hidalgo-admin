import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { paginationLabels, type MessageId } from '@/shared/i18n';
import {
  DataTable,
  EntityCard,
  Pagination,
  RefreshOverlay,
  StatusPill,
  TableAction,
  useElementWidth,
  useListLayout,
  type DataTableColumn,
} from '@/shared/ui';

import {
  categoryLabel,
  formatDuration,
  formatPrice,
  serviceStatus,
  type Service,
  type ServicePage,
} from '../model/service';

type ServicesRowsProps = {
  page: ServicePage;
  refreshing: boolean;
  onOpen: (serviceId: string) => void;
  onNewVersion: (serviceId: string) => void;
  onPageChange: (page: number) => void;
};

/** The services of the page: a table from 900px, cards under it (AdminListPageLayoutSpec.useTable). */
export function ServicesRows({ page, refreshing, onOpen, onNewVersion, onPageChange }: ServicesRowsProps) {
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
            {page.items.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} onOpen={onOpen} onNewVersion={onNewVersion} />
              </li>
            ))}
          </ul>
          <div className="mt-7">{pagination}</div>
        </div>
      ) : (
        <ServicesTable
          services={page.items}
          onOpen={onOpen}
          onNewVersion={onNewVersion}
          footer={pagination}
        />
      )}
    </RefreshOverlay>
  );
}

type ServicesTableProps = {
  services: Service[];
  onOpen: (serviceId: string) => void;
  onNewVersion: (serviceId: string) => void;
  footer: React.ReactNode;
};

/**
 * ServicesTable: from 1400px every column, resizable; under it, duration and price share a
 * "details" column and columns keep their widths.
 */
function ServicesTable({ services, onOpen, onNewVersion, footer }: ServicesTableProps) {
  const intl = useIntl();
  const [ref, width] = useElementWidth();
  const full = (width ?? 0) >= 1400;

  const columns = useMemo((): DataTableColumn<Service>[] => {
    const text = (id: MessageId) => intl.formatMessage({ id });
    const secondary = (value: string) => (
      <span className="block truncate text-content-secondary">{value}</span>
    );
    const name: DataTableColumn<Service> = {
      id: 'service',
      header: text('serviceTableServiceColumn'),
      initialWidth: 220,
      minWidth: 170,
      grow: 3,
      cell: (service) => <span className="block truncate font-bold text-on-surface">{service.name}</span>,
    };
    const category: DataTableColumn<Service> = {
      id: 'category',
      header: text('serviceTableCategoryColumn'),
      initialWidth: full ? 150 : 140,
      minWidth: 120,
      grow: 2,
      cell: (service) => secondary(categoryLabel(service)),
    };
    const priority = (fixed: boolean): DataTableColumn<Service> => ({
      id: 'priority',
      header: text('serviceTablePriorityColumn'),
      ...(fixed ? { fixedWidth: 80 } : { initialWidth: 90, minWidth: 70 }),
      grow: 0,
      cell: (service) => (
        <span className="block truncate font-bold text-content-secondary">{service.displayOrder}</span>
      ),
    });
    const status: DataTableColumn<Service> = {
      id: 'status',
      header: text('serviceTableStatusColumn'),
      fixedWidth: 100,
      cell: (service) => {
        const pill = serviceStatus(service.isActive);
        return <StatusPill label={text(pill.label)} tone={pill.tone} />;
      },
    };
    const actions: DataTableColumn<Service> = {
      id: 'actions',
      header: text('serviceTableActionsColumn'),
      fixedWidth: 132,
      align: 'center',
      interactive: true,
      cell: (service) => (
        <span className="inline-flex gap-1">
          <TableAction
            icon="visibility_outlined"
            label={text('serviceTooltipViewDetail')}
            onClick={() => {
              onOpen(service.id);
            }}
          />
          <TableAction
            icon="copy_all_outlined"
            label={text('serviceTooltipNewVersion')}
            onClick={() => {
              onNewVersion(service.id);
            }}
          />
        </span>
      ),
    };

    if (full) {
      return [
        name,
        category,
        {
          id: 'duration',
          header: text('serviceTableDurationColumn'),
          initialWidth: 120,
          minWidth: 100,
          grow: 1,
          cell: (service) => secondary(formatDuration(service.durationMinutes)),
        },
        {
          id: 'price',
          header: text('serviceTablePriceColumn'),
          initialWidth: 110,
          minWidth: 90,
          grow: 1,
          cell: (service) => secondary(formatPrice(service.priceCents)),
        },
        priority(false),
        status,
        actions,
      ];
    }
    return [
      name,
      category,
      {
        id: 'details',
        header: text('serviceTableDetailsColumn'),
        initialWidth: 220,
        minWidth: 180,
        grow: 3,
        cell: (service) =>
          secondary(`${formatDuration(service.durationMinutes)} · ${formatPrice(service.priceCents)}`),
      },
      priority(true),
      status,
      actions,
    ];
  }, [intl, full, onOpen, onNewVersion]);

  return (
    <div ref={ref}>
      {width !== null && (
        <DataTable
          // A new set of columns starts from their own widths.
          key={full ? 'full' : 'compact'}
          label={intl.formatMessage({ id: 'serviceListTitle' })}
          columns={columns}
          rows={services}
          getRowId={(service) => service.id}
          onRowClick={(service) => {
            onOpen(service.id);
          }}
          rowLabel={(service) => service.name}
          resizable={full}
          footer={footer}
        />
      )}
    </div>
  );
}

type ServiceCardProps = {
  service: Service;
  onOpen: (serviceId: string) => void;
  onNewVersion: (serviceId: string) => void;
};

/** AdminServiceCard: name and status, then category, duration, price, and priority. */
function ServiceCard({ service, onOpen, onNewVersion }: ServiceCardProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const pill = serviceStatus(service.isActive);
  return (
    <EntityCard
      title={service.name}
      status={<StatusPill label={text(pill.label)} tone={pill.tone} />}
      meta={[
        [text('serviceCardCategoryLabel'), categoryLabel(service)],
        [text('serviceCardDurationLabel'), formatDuration(service.durationMinutes)],
        [text('serviceCardPriceLabel'), formatPrice(service.priceCents)],
        [text('serviceCardPriorityLabel'), String(service.displayOrder)],
      ]}
      onOpen={() => {
        onOpen(service.id);
      }}
      actions={[
        {
          icon: 'visibility_outlined',
          label: text('serviceCardViewLabel'),
          onClick: () => {
            onOpen(service.id);
          },
        },
        {
          icon: 'copy_all_outlined',
          label: text('serviceCardNewVersionLabel'),
          onClick: () => {
            onNewVersion(service.id);
          },
        },
      ]}
    />
  );
}
