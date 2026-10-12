import { countriesFor, countryOf, countryPickerRows, favoriteCountries } from './countries';

describe('countries of the phone prefix picker', () => {
  it('names each country in the panel language', () => {
    expect(countryOf('es', 'es')).toEqual({ code: 'ES', dial: '+34', name: 'España' });
    expect(countryOf('ES', 'ca')?.name).toBe('Espanya');
    expect(countryOf('GB', 'en')?.name).toBe('United Kingdom');
    expect(countryOf('ZZ', 'es')).toBeNull();
  });

  it('puts the favorites first, in the list order, with a divider after them', () => {
    const countries = countriesFor('es');
    const favorites = favoriteCountries(countries).map((country) => country.code);
    expect(favorites).toEqual(expect.arrayContaining(['ES', 'FR', 'PT', 'GB', 'AD', 'US', 'IT']));
    const { rows, dividerAfter } = countryPickerRows(countries, '');
    expect(rows).toHaveLength(countries.length);
    expect(rows.slice(0, favorites.length).map((country) => country.code)).toEqual(favorites);
    expect(dividerAfter).toBe(favorites.length - 1);
  });

  it('ranks a search: code, then name, then dial code, ignoring accents', () => {
    const countries = countriesFor('es');
    expect(countryPickerRows(countries, 'es').rows[0]?.code).toBe('ES');
    expect(countryPickerRows(countries, 'espana').rows[0]?.code).toBe('ES');
    expect(countryPickerRows(countries, '+351').rows[0]?.code).toBe('PT');
    expect(countryPickerRows(countries, '351').rows[0]?.code).toBe('PT');
    expect(countryPickerRows(countries, 'xyzw').rows).toEqual([]);
    expect(countryPickerRows(countries, 'es').dividerAfter).toBe(-1);
  });
});
