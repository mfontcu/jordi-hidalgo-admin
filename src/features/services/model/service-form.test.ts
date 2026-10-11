import type { Service } from './service';
import {
  initialCategoryId,
  parseDisplayOrder,
  parsePrice,
  priceText,
  serviceFormDefaults,
  serviceFormSchema,
  type ServiceFormInput,
} from './service-form';

const categories = [
  { id: 'cat-hair', code: 'hair', name: 'Cabello', displayOrder: 1 },
  { id: 'cat-beard', code: 'beard', name: 'Barba', displayOrder: 2 },
];

const base: Service = {
  id: 'svc-1',
  serviceCategoryId: 'cat-beard',
  categoryCode: 'beard',
  categoryDisplayName: 'Barba',
  name: 'Arreglo de barba',
  description: 'Perfilado',
  durationMinutes: 30,
  priceCents: 1500,
  isActive: false,
  displayOrder: 4,
  showOnPublicSite: true,
  translations: [
    { locale: 'es', name: 'Arreglo de barba', description: 'Perfilado' },
    { locale: 'en', name: 'Beard trim', description: 'Shaping' },
  ],
};

const valid: ServiceFormInput = {
  nameEs: ' Corte ',
  nameCa: 'Tall',
  nameEn: 'Haircut',
  serviceCategoryId: 'cat-hair',
  durationMinutes: '45',
  price: '28,5',
  displayOrder: '3',
  descriptionEs: ' Clásico ',
  descriptionCa: '',
  descriptionEn: '',
  isActive: true,
  showOnPublicSite: false,
};

describe('parsing', () => {
  it.each([
    ['28', 28],
    ['28,5', 28.5],
    ['28.50', 28.5],
    [' 0 ', 0],
    ['abc', null],
    ['-1', null],
    ['', null],
    ['1,2,3', null],
  ])('reads the price %j as %j', (text, expected) => {
    expect(parsePrice(text)).toBe(expected);
  });

  it.each([
    ['0', 0],
    [' 12 ', 12],
    ['-1', null],
    ['1.5', null],
    ['x', null],
  ])('reads the display order %j as %j', (text, expected) => {
    expect(parseDisplayOrder(text)).toBe(expected);
  });

  it('writes a price as the Flutter form does', () => {
    expect(priceText(2800)).toBe('28');
    expect(priceText(1250)).toBe('12.5');
    expect(priceText(0)).toBe('');
  });
});

describe('serviceFormSchema', () => {
  it('builds the create request, with the price in cents and trimmed texts', () => {
    expect(serviceFormSchema.parse(valid)).toEqual({
      serviceCategoryId: 'cat-hair',
      durationMinutes: 45,
      priceCents: 2850,
      isActive: true,
      displayOrder: 3,
      showOnPublicSite: false,
      translations: [
        { locale: 'es', name: 'Corte', description: 'Clásico' },
        { locale: 'ca', name: 'Tall', description: '' },
        { locale: 'en', name: 'Haircut', description: '' },
      ],
    });
  });

  it.each([
    ['nameEs', '  ', 'serviceFormNameEsRequired'],
    ['nameCa', '', 'serviceFormNameCaRequired'],
    ['nameEn', '', 'serviceFormNameEnRequired'],
    ['serviceCategoryId', '', 'serviceFormCategoryHint'],
    ['durationMinutes', '', 'serviceFormDurationRequired'],
    ['durationMinutes', '0', 'serviceFormDurationRequired'],
    ['durationMinutes', '12.5', 'serviceFormDurationRequired'],
    ['price', '', 'serviceFormPriceRequired'],
    ['price', 'gratis', 'serviceFormPriceRequired'],
    ['displayOrder', '-1', 'serviceFormPriorityRequired'],
  ] as const)('rejects %s %j with %s', (field, value, message) => {
    const result = serviceFormSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([expect.objectContaining({ path: [field], message })]);
  });
});

describe('serviceFormDefaults', () => {
  it('starts a new service with the first category, 15 minutes, active, and hidden from the web', () => {
    expect(serviceFormDefaults(null, categories)).toEqual({
      nameEs: '',
      nameCa: '',
      nameEn: '',
      serviceCategoryId: 'cat-hair',
      durationMinutes: '15',
      price: '',
      displayOrder: '0',
      descriptionEs: '',
      descriptionCa: '',
      descriptionEn: '',
      isActive: true,
      showOnPublicSite: false,
    });
  });

  it('prefills a new version from the base service, translations first', () => {
    expect(serviceFormDefaults(base, categories)).toEqual({
      nameEs: 'Arreglo de barba',
      nameCa: 'Arreglo de barba',
      nameEn: 'Beard trim',
      serviceCategoryId: 'cat-beard',
      durationMinutes: '30',
      price: '15',
      displayOrder: '4',
      descriptionEs: 'Perfilado',
      descriptionCa: 'Perfilado',
      descriptionEn: 'Shaping',
      isActive: false,
      showOnPublicSite: true,
    });
  });

  it('finds the base category by code when its id is unknown, else takes the first', () => {
    expect(initialCategoryId({ ...base, serviceCategoryId: 'gone' }, categories)).toBe('cat-beard');
    expect(initialCategoryId({ ...base, serviceCategoryId: 'gone', categoryCode: 'gone' }, categories)).toBe(
      'cat-hair',
    );
    expect(initialCategoryId(null, [])).toBe('');
  });
});
