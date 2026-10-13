import { useState, type CSSProperties, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import { failureOf } from '@/shared/lib/failure';
import {
  ActionGroup,
  Button,
  ConfirmDialog,
  detailLayoutFor,
  DetailRow,
  EmptyState,
  FieldError,
  InfoCard,
  Input,
  MutedPanel,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  StatusPill,
  SummaryCard,
  Switch,
  useElementWidth,
  type DetailLayout,
} from '@/shared/ui';

import { useServiceDetail } from '../hooks/use-service-detail';
import {
  categoryLabel,
  formatPrice,
  SERVICE_LOCALES,
  serviceLine,
  serviceStatus,
  translationFor,
  type Service,
} from '../model/service';

type Confirmation = 'activate' | 'deactivate' | 'delete';

/** `/services/{id}` (ServiceDetailScreen). */
export function ServiceDetailScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const detail = useServiceDetail({
    onSuccess: (message) => showToast(intl.formatMessage({ id: message })),
    onError: (error, context) => showErrorToast(describeFailure(error, context)),
  });
  const [ref, width] = useElementWidth();
  const layout = detailLayoutFor(width ?? 1440);
  const service = detail.service;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={intl.formatMessage({ id: 'serviceDetailTitle' })}
            subtitle={intl.formatMessage({ id: 'serviceDetailSubtitle' })}
            back={{ label: intl.formatMessage({ id: 'serviceBackToList' }), onClick: detail.goBack }}
          />
          <div style={{ marginTop: width < 768 ? 12 : layout.gap }}>
            {detail.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : detail.error || !service ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({ id: 'serviceNotFound' })}
                message={
                  failureOf(detail.error).kind === 'notFound'
                    ? intl.formatMessage({ id: 'adminErrorNotFound' })
                    : describeFailure(detail.error)
                }
                action={
                  failureOf(detail.error).kind === 'notFound'
                    ? undefined
                    : {
                        label: intl.formatMessage({ id: 'adminCommonRetry' }),
                        icon: 'refresh',
                        onClick: detail.retry,
                      }
                }
              />
            ) : (
              <ServiceDetailContent detail={detail} service={service} layout={layout} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Detail = ReturnType<typeof useServiceDetail>;
type Layout = DetailLayout;

function ServiceDetailContent({
  detail,
  service,
  layout,
}: {
  detail: Detail;
  service: Service;
  layout: Layout;
}) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const status = serviceStatus(service.isActive);

  const general = (
    <InfoCard title={text('serviceSectionGeneralInfo')} icon="content_cut_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('serviceFieldName')} value={service.name} />
        <DetailRow label={text('serviceFieldCategory')} value={categoryLabel(service)} />
        <DetailRow
          label={text('serviceFieldDuration')}
          value={intl.formatMessage(
            { id: 'serviceFieldDurationMinutes' },
            { minutes: service.durationMinutes },
          )}
        />
        <DetailRow label={text('serviceFieldPrice')} value={formatPrice(service.priceCents)} />
        <DetailRow label={text('serviceFieldPriority')} value={String(service.displayOrder)} />
        <DetailRow label={text('serviceFieldCategoryCode')} value={service.categoryCode} />
      </dl>
    </InfoCard>
  );

  const localeTitles = {
    es: text('serviceLocaleSpanish'),
    ca: text('serviceLocaleCatalan'),
    en: text('serviceLocaleEnglish'),
  };
  const translations = (
    <InfoCard title={text('serviceSectionTranslations')} icon="translate_outlined">
      <div className="flex flex-col gap-3">
        {SERVICE_LOCALES.map((locale) => {
          const translation = translationFor(service, locale);
          return (
            <MutedPanel key={locale}>
              <p className="text-label text-muted-foreground">{localeTitles[locale]}</p>
              <p className="mt-2 text-body-strong text-foreground">{translation.name}</p>
              <p className="mt-2 text-body text-muted-foreground">
                {translation.description || text('serviceNoDescription')}
              </p>
            </MutedPanel>
          );
        })}
      </div>
    </InfoCard>
  );

  const availability = (
    <InfoCard title={text('serviceSectionAvailability')} icon="toggle_on_outlined">
      <dl className="flex flex-col gap-3">
        <DetailRow label={text('serviceAvailabilityStatusLabel')} value={text(status.label)} />
        <DetailRow
          label={text('serviceAvailabilityBookingLabel')}
          value={text(service.isActive ? 'serviceCommonYes' : 'serviceCommonNo')}
        />
      </dl>
      <SubTitle>{text('serviceCatalogOrderTitle')}</SubTitle>
      <DisplayOrderEditor editor={detail.displayOrder} />
      <SubTitle>{text('serviceWebPricingPageTitle')}</SubTitle>
      <MutedPanel className="flex items-center gap-3">
        <p className="flex-1 text-body text-muted-foreground">
          {text(
            detail.showOnPublicSite ? 'serviceWebVisibilityEnabledHint' : 'serviceWebVisibilityDisabledHint',
          )}
        </p>
        {detail.isUpdatingWebVisibility ? (
          <span className="flex size-7 items-center justify-center">
            <Spinner size={24} className="text-primary" />
          </span>
        ) : (
          <Switch
            aria-label={text('serviceWebPricingPageTitle')}
            checked={detail.showOnPublicSite}
            onCheckedChange={detail.setShowOnPublicSite}
          />
        )}
      </MutedPanel>
    </InfoCard>
  );

  const actions = (
    <InfoCard title={text('serviceSectionActions')} icon="bolt_outlined">
      <ActionGroup
        primary={{
          label: text('serviceActionCreateVersion'),
          icon: 'add_circle_outline',
          onClick: detail.createVersion,
        }}
        secondary={
          service.isActive
            ? {
                label: text('serviceActionDeactivate'),
                icon: 'block_outlined',
                onClick: () => {
                  setConfirmation('deactivate');
                },
              }
            : {
                label: text('serviceActionActivate'),
                icon: 'check_circle_outline',
                onClick: () => {
                  setConfirmation('activate');
                },
              }
        }
        danger={{
          label: text('serviceActionDelete'),
          icon: 'delete_outline',
          onClick: () => {
            setConfirmation('delete');
          },
        }}
      />
    </InfoCard>
  );

  const confirmations = {
    activate: {
      title: 'serviceActivateTitle',
      body: 'serviceActivateBody',
      confirm: 'serviceActivateConfirm',
    },
    deactivate: {
      title: 'serviceDeactivateTitle',
      body: 'serviceDeactivateBody',
      confirm: 'serviceDeactivateConfirm',
    },
    delete: { title: 'serviceDeleteTitle', body: 'serviceDeleteBody', confirm: 'serviceDeleteConfirm' },
  } as const;
  const confirm = confirmation ? confirmations[confirmation] : null;

  const style = { '--gap': `${layout.gapLarge}px` } as CSSProperties;
  return (
    <div style={style}>
      <SummaryCard>
        <div
          style={{ padding: layout.summaryPadding }}
          className={layout.twoColumns ? 'flex items-start gap-5' : 'flex flex-col gap-4'}
        >
          <div className="min-w-0 flex-1">
            <p className="text-title text-foreground">{service.name}</p>
            <p className="mt-2 text-body text-muted-foreground">{serviceLine(service)}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <StatusPill
                size="summary"
                tone={service.isActive ? 'info' : 'neutralStrong'}
                label={text(
                  service.isActive ? 'serviceAvailableForBooking' : 'serviceNotAvailableForBooking',
                )}
              />
              <StatusPill
                size="summary"
                tone={service.showOnPublicSite ? 'info' : 'neutralStrong'}
                label={text(service.showOnPublicSite ? 'serviceVisibleOnWeb' : 'serviceNotVisibleOnWeb')}
              />
            </div>
          </div>
          <div className="flex">
            <StatusPill size="large" label={text(status.label)} tone={status.tone} />
          </div>
        </div>
      </SummaryCard>
      <div className="mt-(--gap)">
        {layout.twoColumns ? (
          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {general}
              {translations}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {availability}
              {actions}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {general}
            {translations}
            {availability}
            {actions}
          </div>
        )}
      </div>
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
          title={text(confirm.title)}
          message={text(confirm.body)}
          confirmLabel={text(confirm.confirm)}
          cancelLabel={text('adminCommonCancel')}
          onConfirm={() => {
            if (confirmation === 'delete') detail.remove();
            else detail.setActive(confirmation === 'activate');
          }}
        />
      )}
    </div>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return <p className="mt-4 mb-2 text-label text-muted-foreground">{children}</p>;
}

/** `_DisplayOrderEditor`: hint, the number, and save. */
function DisplayOrderEditor({ editor }: { editor: Detail['displayOrder'] }) {
  const intl = useIntl();
  return (
    <MutedPanel>
      <p className="text-body text-muted-foreground">{intl.formatMessage({ id: 'servicePriorityHint' })}</p>
      <form
        className="mt-3 flex items-start gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          editor.save();
        }}
      >
        {/* A dense TextField with a floating label (InputDecoration.labelText). */}
        <div className="relative w-[120px]">
          <label
            htmlFor="display-order"
            className="pointer-events-none absolute top-1.5 left-4 text-caption text-muted-foreground"
          >
            {intl.formatMessage({ id: 'serviceFieldPriority' })}
          </label>
          <Input
            id="display-order"
            className="pt-5 pb-1.5"
            inputMode="numeric"
            value={editor.text}
            disabled={editor.isSaving}
            aria-invalid={editor.invalid || undefined}
            aria-describedby={editor.invalid ? 'display-order-error' : undefined}
            onChange={(event) => {
              editor.setText(event.target.value);
            }}
          />
        </div>
        <div className="ml-auto flex min-h-12 items-center">
          {editor.isSaving ? (
            <span className="flex size-7 items-center justify-center">
              <Spinner size={24} className="text-primary" />
            </span>
          ) : (
            <Button type="submit">{intl.formatMessage({ id: 'adminCommonSave' })}</Button>
          )}
        </div>
      </form>
      {editor.invalid && (
        <FieldError id="display-order-error" className="px-0">
          {intl.formatMessage({ id: 'servicePriorityValidation' })}
        </FieldError>
      )}
    </MutedPanel>
  );
}
