import { useIntl } from 'react-intl';

import { LOCALES, type MessageId, useLocaleStore } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { Button, Icon, Sheet, SheetContent, SheetTitle, THEME_MODES, useThemeStore } from '@/shared/ui';

import { LANGUAGE_LABEL, THEME_LABEL } from './labels';

type SheetProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** LanguageSelectorBottomSheet: Spanish, Catalan, English; choosing one closes the sheet. */
export function LanguageSheet({ open, onOpenChange }: SheetProps) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  return (
    <OptionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="adminLanguageTitle"
      options={LOCALES.map((value) => ({ value, label: LANGUAGE_LABEL[value] }))}
      selected={locale}
      onSelect={setLocale}
    />
  );
}

/** ThemeSelectorBottomSheet: system, light, dark; choosing one closes the sheet. */
export function ThemeSheet({ open, onOpenChange }: SheetProps) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  return (
    <OptionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="adminAppearanceTitle"
      options={THEME_MODES.map((value) => ({ value, label: THEME_LABEL[value] }))}
      selected={mode}
      onSelect={setMode}
    />
  );
}

type OptionSheetProps<T extends string> = SheetProps & {
  title: MessageId;
  options: { value: T; label: MessageId }[];
  selected: T;
  onSelect: (value: T) => void;
};

/** Language and theme sheets: a centered heading and one outlined option per choice. */
function OptionSheet<T extends string>({
  open,
  onOpenChange,
  title,
  options,
  selected,
  onSelect,
}: OptionSheetProps<T>) {
  const intl = useIntl();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent handle={false} aria-describedby={undefined}>
        <div className="flex flex-col px-4 pt-5 pb-6">
          <SheetTitle className="text-center text-heading">{intl.formatMessage({ id: title })}</SheetTitle>
          <div
            role="radiogroup"
            aria-label={intl.formatMessage({ id: title })}
            className="mt-4 flex flex-col gap-2.5"
          >
            {options.map((option) => {
              const checked = option.value === selected;
              return (
                <Button
                  key={option.value}
                  variant="secondary"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    onSelect(option.value);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'min-h-0 justify-between rounded-md px-4 py-3.5 text-body-strong',
                    checked ? 'border-foreground' : 'border-border',
                  )}
                >
                  {intl.formatMessage({ id: option.label })}
                  <Icon name={checked ? 'radio_button_checked' : 'radio_button_off'} />
                </Button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
