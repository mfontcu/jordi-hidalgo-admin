import { detectLocale } from './locales';

describe('detectLocale', () => {
  it.each([
    [['es-ES', 'en'], 'es'],
    [['ca'], 'ca'],
    [['ca-ES', 'es-ES'], 'ca'],
    [['en-GB'], 'en'],
    [['EN-us'], 'en'],
  ] as const)('uses the first browser language when the panel has it: %j → %s', (languages, locale) => {
    expect(detectLocale(languages)).toBe(locale);
  });

  it('falls back to Spanish otherwise, like the Flutter panel (only the first language counts)', () => {
    expect(detectLocale(['fr-FR', 'ca'])).toBe('es');
    expect(detectLocale([])).toBe('es');
  });
});
