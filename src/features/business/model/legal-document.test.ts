import { nextSurfaces, translationFor, type LegalDocument } from './legal-document';

const doc = (): LegalDocument => ({
  id: 'legal-1',
  code: 'privacy_policy',
  isActive: true,
  publicSurfaces: ['app', 'web'],
  translations: [{ locale: 'es', title: 'Privacidad', content: '# Hola' }],
});

describe('legal document', () => {
  it('returns an empty translation when the locale is missing', () => {
    expect(translationFor(doc(), 'en')).toEqual({ locale: 'en', title: '', content: '' });
  });

  it('refuses to clear the last public surface', () => {
    expect(nextSurfaces(['app', 'web'], 'app', false)).toEqual(['web']);
    expect(nextSurfaces(['web'], 'web', false)).toBeNull();
    expect(nextSurfaces(['web'], 'app', true)).toEqual(['app', 'web']);
  });
});
