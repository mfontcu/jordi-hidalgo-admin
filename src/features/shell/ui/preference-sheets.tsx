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

/**
 * The app_ui selector sheets: a plain modal bottom sheet (no drag handle, Material's 640px maximum
 * width, 24px top corners), a centered 18/w800 title, and one outlined tile per option with a
 * radio icon.
 */
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
      <SheetContent handle={false} aria-describedby={undefined} className="min-[700px]:max-w-[640px]">
        <div className="flex flex-col px-4 pt-5 pb-6">
          <SheetTitle className="text-center text-title-lg font-extrabold">
            {intl.formatMessage({ id: title })}
          </SheetTitle>
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
                  // _ThemeOptionTile: 18px radius, onSurface border when selected, 16x14 padding, 15/w700.
                  className={cn(
                    'min-h-0 justify-between rounded-[18px] px-4 py-3.5 text-[15px] font-bold',
                    checked ? 'border-on-surface' : 'border-outline-variant',
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
