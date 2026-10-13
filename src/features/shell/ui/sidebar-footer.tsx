import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { APP_VERSION } from '@/shared/config/app-version';
import { useLocaleStore } from '@/shared/i18n';
import {
  Button,
  Icon,
  type IconName,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useThemeStore,
} from '@/shared/ui';

import { LANGUAGE_LABEL, THEME_LABEL } from './labels';
import { LanguageSheet, ThemeSheet } from './preference-sheets';
import { SidebarIconButton } from './sidebar-icon-button';

type SidebarFooterProps = { compact: boolean; onSignOut: () => void };

/**
 * `_AdminSidebarFooter`: language and theme chips, sign-out, and the attribution; three icon
 * buttons when compact.
 */
export function SidebarFooter({ compact, onSignOut }: SidebarFooterProps) {
  const intl = useIntl();
  const locale = useLocaleStore((state) => state.locale);
  const themeMode = useThemeStore((state) => state.mode);
  const [sheet, setSheet] = useState<'language' | 'theme' | null>(null);

  const languageTitle = intl.formatMessage({ id: 'adminLanguageTitle' });
  const themeTitle = intl.formatMessage({ id: 'adminAppearanceTitle' });
  const signOutLabel = intl.formatMessage({ id: 'adminLogout' });

  const sheets = (
    <>
      <LanguageSheet
        open={sheet === 'language'}
        onOpenChange={(open) => {
          setSheet(open ? 'language' : null);
        }}
      />
      <ThemeSheet
        open={sheet === 'theme'}
        onOpenChange={(open) => {
          setSheet(open ? 'theme' : null);
        }}
      />
    </>
  );

  if (compact) {
    return (
      // The buttons keep their own width and sit at the start, as in the Flutter column.
      <div className="flex flex-col items-start gap-1 px-2 pt-2 pb-3">
        <SidebarIconButton
          small
          icon="language"
          label={languageTitle}
          onClick={() => {
            setSheet('language');
          }}
        />
        <SidebarIconButton
          small
          icon="dark_mode_outlined"
          label={themeTitle}
          onClick={() => {
            setSheet('theme');
          }}
        />
        <SidebarIconButton small icon="logout_rounded" label={signOutLabel} onClick={onSignOut} />
        {sheets}
      </div>
    );
  }

  return (
    <div className="px-3 pt-2.5 pb-3.5">
      <div className="flex flex-col rounded-lg border border-white/6 bg-sidebar px-2.5 pt-2.5 pb-2">
        <div className="flex gap-2">
          <UtilityChip
            icon="language"
            label={intl.formatMessage({ id: LANGUAGE_LABEL[locale] })}
            tooltip={languageTitle}
            onClick={() => {
              setSheet('language');
            }}
          />
          <UtilityChip
            icon="dark_mode_outlined"
            label={intl.formatMessage({ id: THEME_LABEL[themeMode] })}
            tooltip={themeTitle}
            onClick={() => {
              setSheet('theme');
            }}
          />
        </div>
        <div className="my-2 h-px bg-white/8" />
        <Button
          variant="text"
          icon="logout_rounded"
          onClick={onSignOut}
          className="min-h-0 gap-2 rounded-md px-2 py-2 text-label text-sidebar-muted hover:bg-white/6 [&_svg]:size-5"
        >
          {signOutLabel}
        </Button>
        <p className="mt-1.5 text-center text-caption text-sidebar-muted/75">
          <FormattedMessage
            id="shellFooterAttribution"
            values={{
              version: APP_VERSION,
              developedBy: intl.formatMessage({ id: 'adminFooterDevelopedBy' }),
              developer: intl.formatMessage({ id: 'shellFooterDeveloperName' }),
              link: (chunks) => (
                <a
                  href="https://mfontcuberta.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block whitespace-nowrap text-sidebar-muted/85 underline decoration-sidebar-muted/50"
                >
                  {chunks}
                </a>
              ),
            }}
          />
        </p>
      </div>
      {sheets}
    </div>
  );
}

type UtilityChipProps = { icon: IconName; label: string; tooltip: string; onClick: () => void };

/** Language and theme controls in the sidebar footer. */
function UtilityChip({ icon, label, tooltip, onClick }: UtilityChipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="text"
          onClick={onClick}
          className="min-h-0 min-w-0 flex-1 gap-1.5 rounded-md bg-white/4 px-2 py-2 text-caption text-sidebar-muted dark:hover:bg-white/8"
        >
          <Icon name={icon} size={20} />
          <span className="truncate">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
