import { searchWithDoc, searchWithTab, tabOf } from './business-tab';

describe('business tab search', () => {
  it('defaults to info and omits the tab parameter', () => {
    expect(tabOf({})).toBe('info');
    expect(searchWithTab('info')).toEqual({});
    expect(searchWithTab('legal')).toEqual({ tab: 'legal' });
  });

  it('keeps doc only on legal and web', () => {
    expect(searchWithTab('legal', 'privacy_policy')).toEqual({
      tab: 'legal',
      doc: 'privacy_policy',
    });
    expect(searchWithTab('gallery', 'privacy_policy')).toEqual({ tab: 'gallery' });
    expect(searchWithDoc({ tab: 'legal', doc: 'privacy_policy' }, 'cookie_policy')).toEqual({
      tab: 'legal',
      doc: 'cookie_policy',
    });
    expect(searchWithDoc({ tab: 'booking' }, 'privacy_policy')).toEqual({ tab: 'booking' });
  });
});
