import {
  categoriesSummary,
  categoryLabel,
  categoryTitle,
  formatDuration,
  formatPrice,
  serviceStatus,
  sortCategories,
  translationFor,
} from './service';

const category = (code: string, name: string, displayOrder = 0) => ({
  id: `id-${code}`,
  code,
  name,
  displayOrder,
});

describe('service presentation', () => {
  it('formats the price with two decimals and the euro sign', () => {
    expect(formatPrice(2800)).toBe('28.00 €');
    expect(formatPrice(1250)).toBe('12.50 €');
    expect(formatPrice(0)).toBe('0.00 €');
  });

  it('formats the duration in minutes', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('labels the category by name, then code, then a dash', () => {
    expect(categoryLabel({ categoryDisplayName: ' Cabello ', categoryCode: 'hair' })).toBe('Cabello');
    expect(categoryLabel({ categoryDisplayName: '', categoryCode: 'hair' })).toBe('hair');
    expect(categoryLabel({ categoryDisplayName: ' ', categoryCode: '' })).toBe('—');
    expect(categoryTitle({ name: '', code: '' })).toBe('—');
    expect(categoryTitle({ name: '', code: 'beard' })).toBe('beard');
  });

  it('shows an active service as a success pill and an inactive one as neutral', () => {
    expect(serviceStatus(true)).toEqual({ label: 'serviceStatusActive', tone: 'success' });
    expect(serviceStatus(false)).toEqual({ label: 'serviceStatusInactive', tone: 'neutral' });
  });
});

describe('categories', () => {
  it('sorts by catalog order', () => {
    const sorted = sortCategories([category('b', 'B', 2), category('a', 'A', 1)]);
    expect(sorted.map((item) => item.code)).toEqual(['a', 'b']);
  });

  it('summarizes up to three names, then an ellipsis', () => {
    expect(categoriesSummary([])).toBeNull();
    expect(categoriesSummary([category('a', 'Cabello'), category('b', '')])).toBe('Cabello, b');
    expect(
      categoriesSummary([category('a', 'A'), category('b', 'B'), category('c', 'C'), category('d', 'D')]),
    ).toBe('A, B, C…');
  });
});

describe('translationFor', () => {
  const service = {
    name: 'Corte',
    description: 'Corte clásico',
    translations: [{ locale: 'CA', name: 'Tall', description: 'Tall clàssic' }],
  };

  it('finds a translation by locale, in any case', () => {
    expect(translationFor(service, 'ca')).toEqual({ name: 'Tall', description: 'Tall clàssic' });
  });

  it('falls back to the localized name and description', () => {
    expect(translationFor(service, 'en')).toEqual({ name: 'Corte', description: 'Corte clásico' });
  });
});
