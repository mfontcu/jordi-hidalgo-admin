import type { Locale, MessageId } from '@/shared/i18n';
import type { ThemeMode } from '@/shared/ui';

export const LANGUAGE_LABEL: Record<Locale, MessageId> = {
  es: 'adminLanguageSpanish',
  ca: 'adminLanguageCatalan',
  en: 'adminLanguageEnglish',
};

export const THEME_LABEL: Record<ThemeMode, MessageId> = {
  system: 'adminAppearanceSystem',
  light: 'adminAppearanceLight',
  dark: 'adminAppearanceDark',
};
