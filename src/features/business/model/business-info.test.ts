import {
  businessInfoFormSchema,
  businessInfoFormValues,
  localesOf,
  toBusinessInfoUpdate,
  translationFor,
  type BusinessInfo,
} from './business-info';

const info = (overrides: Partial<BusinessInfo> = {}): BusinessInfo => ({
  id: 'biz-1',
  email: 'hello@hidalgojunior.com',
  phone: '+34600000000',
  whatsappPhone: '',
  mapsUrl: '',
  instagramUrl: '',
  websiteUrl: '',
  isActive: true,
  translations: [
    {
      locale: 'en',
      name: 'Hidalgo',
      address: 'Street',
      schedule: 'Mon-Fri',
      about: 'About',
      cancellationPolicy: 'Policy',
    },
    {
      locale: 'es',
      name: 'Hidalgo ES',
      address: 'Calle',
      schedule: 'L-V',
      about: 'Sobre',
      cancellationPolicy: 'Política',
    },
  ],
  ...overrides,
});

describe('business info', () => {
  it('orders locales es → ca → en and fills missing ones for the form', () => {
    expect(localesOf(info())).toEqual(['es', 'en']);
    const values = businessInfoFormValues(info());
    expect(values.translations.es?.name).toBe('Hidalgo ES');
    expect(values.translations.en?.name).toBe('Hidalgo');
  });

  it('returns an empty translation when the locale is missing', () => {
    expect(translationFor(info(), 'ca')).toEqual({
      locale: 'ca',
      name: '',
      address: '',
      schedule: '',
      about: '',
      cancellationPolicy: '',
    });
  });

  it('omits blank optional contact fields on the wire', () => {
    const update = toBusinessInfoUpdate(
      businessInfoFormValues(
        info({
          whatsappPhone: '  ',
          mapsUrl: ' https://maps.example ',
          instagramUrl: '',
          websiteUrl: 'https://hidalgojunior.com',
        }),
      ),
    );
    expect(update.whatsappPhone).toBeUndefined();
    expect(update.mapsUrl).toBe('https://maps.example');
    expect(update.instagramUrl).toBeUndefined();
    expect(update.websiteUrl).toBe('https://hidalgojunior.com');
    expect(update.translations.map((row) => row.locale)).toEqual(['es', 'en']);
  });

  it('requires email and phone', () => {
    const result = businessInfoFormSchema.safeParse({
      ...businessInfoFormValues(info()),
      email: ' ',
      phone: '',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string') fields[field] = issue.message;
    }
    expect(fields).toEqual({ email: 'businessFieldRequired', phone: 'businessFieldRequired' });
  });
});
