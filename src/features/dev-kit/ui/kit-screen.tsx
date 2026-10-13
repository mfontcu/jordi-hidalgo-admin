import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { LOCALES, type Locale, type MessageId, useLocaleStore } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import {
  PortalContainerContext,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toaster,
  TooltipProvider,
} from '@/shared/ui';

import { KIT_MODES, type KitMode } from '../model/kit-mode';
import {
  ButtonsSection,
  CalendarSection,
  ChoiceSection,
  ColorsSection,
  FieldsSection,
  IconsSection,
  OverlaysSection,
  SelectSection,
  SidebarSection,
  SpacingSection,
  TypographySection,
} from './kit-sections';

const MODE_LABEL: Record<KitMode, MessageId> = {
  both: 'devKitModeBoth',
  light: 'adminAppearanceLight',
  dark: 'adminAppearanceDark',
};

const LANGUAGE_LABEL: Record<Locale, MessageId> = {
  es: 'adminLanguageSpanish',
  ca: 'adminLanguageCatalan',
  en: 'adminLanguageEnglish',
};

type KitScreenProps = {
  mode: KitMode;
  onModeChange: (mode: KitMode) => void;
};

/** Development-only page (/_kit): the review board of this design system. */
export function KitScreen({ mode, onModeChange }: KitScreenProps) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const schemes = mode === 'both' ? (['light', 'dark'] as const) : [mode];

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="flex flex-wrap items-center gap-4 border-b border-border bg-card px-6 py-3">
          <div className="mr-auto flex flex-col">
            <h1 className="text-title text-foreground">
              <FormattedMessage id="devKitTitle" />
            </h1>
            <p className="text-body text-muted-foreground">
              <FormattedMessage id="devKitSubtitle" />
            </p>
          </div>
          <div role="radiogroup" className="flex rounded-md border border-border p-1">
            {KIT_MODES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => {
                  onModeChange(value);
                }}
                className={cn(
                  'cursor-pointer rounded-md px-4 py-1.5 text-body text-muted-foreground',
                  mode === value && 'bg-selection-wash text-selection',
                )}
              >
                <FormattedMessage id={MODE_LABEL[value]} />
              </button>
            ))}
          </div>
          <Select
            value={locale}
            onValueChange={(value) => {
              setLocale(value as Locale);
            }}
          >
            <SelectTrigger className="w-44" aria-label={intl.formatMessage({ id: 'adminLanguageTitle' })}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((value) => (
                <SelectItem key={value} value={value}>
                  <FormattedMessage id={LANGUAGE_LABEL[value]} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>
        <div className={cn('grid flex-1', schemes.length === 2 && 'lg:grid-cols-2')}>
          {schemes.map((scheme) => (
            <KitColumn key={scheme} scheme={scheme} locale={locale} />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

/** One column in one mode. Its overlays and toasts render inside it, so they use the same mode. */
function KitColumn({ scheme, locale }: { scheme: 'light' | 'dark'; locale: Locale }) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const toasterId = `kit-${scheme}`;

  return (
    <div className={cn(scheme, 'flex flex-col gap-4 bg-background p-4 text-foreground sm:p-6')}>
      <PortalContainerContext value={portal}>
        <ColorsSection />
        <TypographySection />
        <SpacingSection />
        <IconsSection />
        <ButtonsSection />
        <FieldsSection />
        <SelectSection />
        <ChoiceSection />
        <OverlaysSection language={locale} toasterId={toasterId} />
        <CalendarSection language={locale} />
        <SidebarSection />
      </PortalContainerContext>
      <div ref={setPortal}>
        <Toaster id={toasterId} />
      </div>
    </div>
  );
}
