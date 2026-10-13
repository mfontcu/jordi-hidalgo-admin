import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { useDescribeFailure } from '@/shared/i18n';
import {
  Button,
  FormField,
  InfoCard,
  Input,
  showErrorToast,
  showToast,
  Switch,
  Textarea,
  UnsavedChangesGuard,
} from '@/shared/ui';

import { useBusinessInfo } from '../../hooks/use-business-info';
import type { BusinessInfo } from '../../model/business-info';
import { textOf } from '../shared/labels';
import { LocaleSegmented } from '../shared/locale-segmented';

type InfoTabProps = { info: BusinessInfo };

/** Business contact fields and per-locale public texts. */
export function InfoTab({ info }: InfoTabProps) {
  const intl = useIntl();
  const text = textOf(intl);
  const describeFailure = useDescribeFailure();
  const form = useBusinessInfo(info, {
    onSaved: () => {
      showToast(text('businessInfoSaved'));
    },
    onError: (error) => {
      showErrorToast(describeFailure(error, 'businessInfoSaveError'));
    },
  });
  const { register, control } = form.form;
  const translationPath = `translations.${form.locale}` as const;

  return (
    <div className="flex flex-col gap-6">
      <UnsavedChangesGuard
        when={form.hasUnsavedChanges}
        labels={{
          title: text('legalUnsavedChangesTitle'),
          message: text('legalUnsavedChangesBody'),
          keepEditing: text('legalKeepEditing'),
          discard: text('legalDiscard'),
        }}
      />

      <InfoCard title={text('businessInfoGeneralDataTitle')} icon="storefront_outlined">
        <p className="mb-4 text-body text-muted-foreground">{text('businessInfoGeneralDataSubtitle')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="business-email"
            label={text('businessFieldEmail')}
            error={(() => {
              const key = form.errorKey('email');
              return key ? text(key) : undefined;
            })()}
          >
            <Input id="business-email" {...register('email')} />
          </FormField>
          <FormField
            id="business-phone"
            label={text('businessFieldPhone')}
            error={(() => {
              const key = form.errorKey('phone');
              return key ? text(key) : undefined;
            })()}
          >
            <Input id="business-phone" {...register('phone')} />
          </FormField>
          <FormField id="business-whatsapp" label={text('businessFieldWhatsapp')}>
            <Input id="business-whatsapp" {...register('whatsappPhone')} />
          </FormField>
          <FormField id="business-maps" label={text('businessFieldGoogleMapsUrl')}>
            <Input id="business-maps" {...register('mapsUrl')} />
          </FormField>
          <FormField id="business-instagram" label={text('businessFieldInstagramUrl')}>
            <Input id="business-instagram" {...register('instagramUrl')} />
          </FormField>
          <FormField id="business-website" label={text('businessFieldWebsiteUrl')}>
            <Input id="business-website" {...register('websiteUrl')} />
          </FormField>
        </div>
      </InfoCard>

      <InfoCard title={text('businessInfoActiveTitle')} icon="toggle_on_outlined">
        <div className="flex items-center justify-between gap-4">
          <p className="text-body text-muted-foreground">{text('businessInfoActiveSubtitle')}</p>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label={text('businessInfoActiveTitle')}
              />
            )}
          />
        </div>
      </InfoCard>

      <InfoCard title={text('businessInfoTextsTitle')} icon="translate_outlined">
        <p className="mb-4 text-body text-muted-foreground">{text('businessInfoTextsSubtitle')}</p>
        <div className="mb-4">
          <LocaleSegmented value={form.locale} onValueChange={form.setLocale} />
        </div>
        <div className="flex flex-col gap-4">
          <FormField id={`business-name-${form.locale}`} label={text('businessTranslationFieldName')}>
            <Input id={`business-name-${form.locale}`} {...register(`${translationPath}.name`)} />
          </FormField>
          <FormField id={`business-address-${form.locale}`} label={text('businessTranslationFieldAddress')}>
            <Input id={`business-address-${form.locale}`} {...register(`${translationPath}.address`)} />
          </FormField>
          <FormField id={`business-schedule-${form.locale}`} label={text('businessTranslationFieldSchedule')}>
            <Input id={`business-schedule-${form.locale}`} {...register(`${translationPath}.schedule`)} />
          </FormField>
          <FormField id={`business-about-${form.locale}`} label={text('businessTranslationFieldAbout')}>
            <Textarea
              id={`business-about-${form.locale}`}
              rows={4}
              {...register(`${translationPath}.about`)}
            />
          </FormField>
          <FormField
            id={`business-cancellation-${form.locale}`}
            label={text('businessTranslationFieldCancellationPolicy')}
          >
            <Textarea
              id={`business-cancellation-${form.locale}`}
              rows={4}
              {...register(`${translationPath}.cancellationPolicy`)}
            />
          </FormField>
        </div>
      </InfoCard>

      <div>
        <Button
          type="button"
          loading={form.isSaving}
          onClick={() => {
            void form.submit();
          }}
        >
          {form.isSaving ? text('businessInfoSaving') : text('businessInfoSave')}
        </Button>
      </div>
    </div>
  );
}
