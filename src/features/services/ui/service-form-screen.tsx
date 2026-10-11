import type { ReactNode } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { useDescribeFailure, type MessageId } from '@/shared/i18n';
import {
  ActionGroup,
  EmptyState,
  FormField,
  InfoCard,
  Input,
  LoadingBarrier,
  LookupField,
  LookupList,
  MutedPanel,
  PageHeader,
  showErrorToast,
  showToast,
  Spinner,
  SummaryCard,
  Switch,
  Textarea,
  UnsavedChangesGuard,
  useElementWidth,
} from '@/shared/ui';

import { useServiceForm, useServiceFormData } from '../hooks/use-service-form';
import { serviceLine, type Service, type ServiceCategory } from '../model/service';
import type { ServiceFormInput } from '../model/service-form';

/** `_ServiceFormLayoutSpec`, by the screen's width. */
function formLayoutFor(width: number) {
  if (width < 640)
    return { padding: 16, gap: 20, gapLarge: 24, titleSize: 24, subtitleSize: 14, twoColumns: false };
  if (width < 1040)
    return { padding: 20, gap: 22, gapLarge: 26, titleSize: 28, subtitleSize: 14, twoColumns: false };
  return { padding: 24, gap: 24, gapLarge: 28, titleSize: 30, subtitleSize: 15, twoColumns: true };
}

type Layout = ReturnType<typeof formLayoutFor>;

/** `/services/form` and `/services/{id}/form` (ServiceFormScreen): a new service or a new version. */
export function ServiceFormScreen() {
  const intl = useIntl();
  const describeFailure = useDescribeFailure();
  const data = useServiceFormData();
  const [ref, width] = useElementWidth();
  const layout = formLayoutFor(width ?? 1440);
  const isNewVersion = data.isNewVersion;

  return (
    <div ref={ref} className="min-w-0">
      {width !== null && (
        <div style={{ padding: layout.padding }}>
          <PageHeader
            title={intl.formatMessage({
              id: isNewVersion ? 'serviceFormNewVersionTitle' : 'serviceFormNewTitle',
            })}
            subtitle={intl.formatMessage({
              id: isNewVersion ? 'serviceFormNewVersionSubtitle' : 'serviceFormNewSubtitle',
            })}
            titleSize={layout.titleSize}
            subtitleSize={layout.subtitleSize}
            back={{ label: intl.formatMessage({ id: 'serviceBackToList' }), onClick: data.goBack }}
          />
          <div style={{ marginTop: width < 700 ? 12 : layout.gap }}>
            {data.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size={36} className="text-primary" />
              </div>
            ) : data.error || !data.categories || data.base === undefined ? (
              <EmptyState
                icon="error_outline"
                title={intl.formatMessage({
                  id: isNewVersion ? 'serviceFormLoadError' : 'serviceFormCategoriesLoadError',
                })}
                message={describeFailure(data.error)}
                action={{
                  label: intl.formatMessage({ id: 'adminCommonRetry' }),
                  icon: 'refresh',
                  onClick: data.retry,
                }}
              />
            ) : (
              <ServiceFormContent
                base={data.base}
                categories={data.categories}
                layout={layout}
                onCancel={data.goBack}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ContentProps = {
  base: Service | null;
  categories: ServiceCategory[];
  layout: Layout;
  onCancel: () => void;
};

function ServiceFormContent({ base, categories, layout, onCancel }: ContentProps) {
  const intl = useIntl();
  const text = (id: MessageId) => intl.formatMessage({ id });
  const describeFailure = useDescribeFailure();
  const form = useServiceForm({
    base,
    categories,
    onSaved: (_, isNewVersion) => {
      showToast(text(isNewVersion ? 'serviceVersionCreatedToast' : 'serviceCreatedToast'));
    },
    onError: (error) => {
      showErrorToast(describeFailure(error, 'serviceFormSaveFailed'));
    },
  });
  const { register, control } = form.form;
  const errorText = (field: keyof ServiceFormInput) => {
    const key = form.errorKey(field);
    return key ? text(key) : undefined;
  };
  const field = (name: keyof ServiceFormInput) => ({
    id: `service-${name}`,
    'aria-invalid': form.errorKey(name) ? true : undefined,
    'aria-describedby': form.errorKey(name) ? `service-${name}-error` : undefined,
  });

  const textField = (name: keyof ServiceFormInput, label: MessageId, hint: MessageId, extra?: ReactNode) => (
    <FormField id={`service-${name}`} label={text(label)} error={errorText(name)}>
      <Input {...field(name)} placeholder={text(hint)} {...register(name)} />
      {extra}
    </FormField>
  );

  const mainInfo = (
    <InfoCard title={text('serviceFormSectionMainInfo')} icon="content_cut_outlined">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 items-start gap-3">
          {textField('nameEs', 'serviceFormNameEsLabel', 'serviceFormNameEsHint')}
          {textField('nameCa', 'serviceFormNameCaLabel', 'serviceFormNameCaHint')}
        </div>
        {textField('nameEn', 'serviceFormNameEnLabel', 'serviceFormNameEnHint')}
        <div className="grid grid-cols-2 items-start gap-3">
          <LookupField
            id="service-serviceCategoryId"
            label={text('serviceFormCategoryLabel')}
            value={form.categoryLabel}
            placeholder={intl.formatMessage(
              { id: 'appointmentLookupSelectHint' },
              { field: text('serviceFormCategoryLabel').toLowerCase() },
            )}
            open={form.categoriesOpen}
            onOpenChange={form.setCategoriesOpen}
            onClear={form.clearCategory}
            labels={{
              open: intl.formatMessage(
                { id: 'appointmentLookupSearchTooltip' },
                { field: text('serviceFormCategoryLabel').toLowerCase() },
              ),
              clear: intl.formatMessage(
                { id: 'appointmentLookupClearTooltip' },
                { field: text('serviceFormCategoryLabel').toLowerCase() },
              ),
            }}
            error={
              form.errorKey('serviceCategoryId')
                ? text(categories.length === 0 ? 'serviceFormCategoryEmpty' : 'serviceFormCategoryHint')
                : undefined
            }
          >
            <LookupList
              label={text('serviceFormCategoryLabel')}
              options={form.categoryOptions}
              onSelect={form.pickCategory}
              empty={text('serviceCategoryEmptyMigration')}
            />
          </LookupField>
          <FormField
            id="service-durationMinutes"
            label={text('serviceFormDurationLabel')}
            error={errorText('durationMinutes')}
          >
            <Input
              {...field('durationMinutes')}
              inputMode="numeric"
              placeholder={text('serviceFormDurationHint')}
              {...register('durationMinutes')}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 items-start gap-3">
          <FormField id="service-price" label={text('serviceFormPriceLabel')} error={errorText('price')}>
            <Input
              {...field('price')}
              inputMode="decimal"
              placeholder={text('serviceFormPriceHint')}
              {...register('price')}
            />
          </FormField>
          <FormField
            id="service-displayOrder"
            label={text('serviceFormPriorityLabel')}
            error={errorText('displayOrder')}
            hint={text('servicePriorityCatalogHint')}
          >
            <Input
              {...field('displayOrder')}
              inputMode="numeric"
              placeholder={text('serviceFormPriorityHint')}
              {...register('displayOrder')}
            />
          </FormField>
        </div>
      </div>
    </InfoCard>
  );

  const descriptions = (
    <InfoCard title={text('serviceFormSectionTranslations')} icon="translate_outlined">
      <div className="flex flex-col gap-4">
        {(
          [
            ['descriptionEs', 'serviceFormDescriptionEsLabel', 'serviceFormDescriptionEsHint'],
            ['descriptionCa', 'serviceFormDescriptionCaLabel', 'serviceFormDescriptionCaHint'],
            ['descriptionEn', 'serviceFormDescriptionEnLabel', 'serviceFormDescriptionEnHint'],
          ] as const
        ).map(([name, label, hint]) => (
          <FormField key={name} id={`service-${name}`} label={text(label)}>
            <Textarea
              id={`service-${name}`}
              // TextFormField(maxLines: 4): four lines, no resizing.
              rows={4}
              className="resize-none"
              placeholder={text(hint)}
              {...register(name)}
            />
          </FormField>
        ))}
      </div>
    </InfoCard>
  );

  const availability = (
    <InfoCard title={text('serviceFormSectionAvailability')} icon="toggle_on_outlined">
      <div className="flex flex-col gap-3">
        <Controller
          control={control}
          name="isActive"
          render={({ field: { value, onChange } }) => (
            <MutedPanel className="flex items-center gap-3">
              <p className="flex-1 leading-[1.5] text-content-secondary">
                {text(value ? 'serviceFormActiveVersionHint' : 'serviceFormInactiveVersionHint')}
              </p>
              <Switch
                aria-label={text('serviceAvailabilityBookingLabel')}
                checked={value}
                onCheckedChange={onChange}
              />
            </MutedPanel>
          )}
        />
        <Controller
          control={control}
          name="showOnPublicSite"
          render={({ field: { value, onChange } }) => (
            <MutedPanel className="flex items-center gap-3">
              <p className="flex-1 leading-[1.5] text-content-secondary">
                {text(value ? 'serviceFormWebVisibleHint' : 'serviceFormWebHiddenHint')}
              </p>
              <Switch
                aria-label={text('serviceWebPricingPageTitle')}
                checked={value}
                onCheckedChange={onChange}
              />
            </MutedPanel>
          )}
        />
      </div>
    </InfoCard>
  );

  const actions = (
    <InfoCard title={text('serviceFormSectionActions')} icon="bolt_outlined">
      <ActionGroup
        primary={{
          label: text(base ? 'serviceActionCreateVersion' : 'serviceActionCreateService'),
          icon: 'save_outlined',
          onClick: () => {
            void form.submit();
          },
          loading: form.isSaving,
        }}
        secondary={{ label: text('adminCommonCancel'), icon: 'close', onClick: onCancel }}
      />
    </InfoCard>
  );

  return (
    <form
      noValidate
      className="flex flex-col"
      style={{ gap: layout.gapLarge }}
      onSubmit={(event) => {
        void form.submit(event);
      }}
    >
      {base && (
        <SummaryCard className="p-5">
          <p className="text-[14px] font-bold text-content-secondary">
            {text('serviceFormBaseServiceTitle')}
          </p>
          <p className="mt-2 text-[28px] leading-[1.05] font-black text-on-surface">{base.name}</p>
          <p className="mt-2 text-[15px] leading-[1.5] text-content-secondary">{serviceLine(base)}</p>
        </SummaryCard>
      )}
      <div>
        {layout.twoColumns ? (
          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {mainInfo}
              {descriptions}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {availability}
              {actions}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {mainInfo}
            {descriptions}
            {availability}
            {actions}
          </div>
        )}
      </div>
      <UnsavedChangesGuard
        when={form.hasUnsavedChanges}
        labels={{
          title: text('adminUnsavedChangesTitle'),
          message: text('adminUnsavedChangesBody'),
          keepEditing: text('adminUnsavedChangesKeepEditing'),
          discard: text('adminUnsavedChangesDiscard'),
        }}
      />
      {form.isSaving && <LoadingBarrier message={text('serviceFormSavingBarrier')} />}
    </form>
  );
}
