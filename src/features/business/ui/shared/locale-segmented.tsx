import { useIntl } from 'react-intl';

import { SegmentedTabs } from '@/shared/ui';

import { BUSINESS_LOCALE_LABEL, BUSINESS_LOCALES, type BusinessLocale } from '../../model/locales';
import { textOf } from './labels';

type LocaleSegmentedProps = {
  value: BusinessLocale;
  onValueChange: (locale: BusinessLocale) => void;
  locales?: readonly BusinessLocale[];
};

/** es / ca / en control for CMS translation panes. */
export function LocaleSegmented({ value, onValueChange, locales = BUSINESS_LOCALES }: LocaleSegmentedProps) {
  const intl = useIntl();
  const text = textOf(intl);
  return (
    <SegmentedTabs<BusinessLocale>
      label={text('legalLanguage')}
      tabs={locales.map((locale) => ({
        value: locale,
        label: text(BUSINESS_LOCALE_LABEL[locale]),
        icon: 'language',
      }))}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
