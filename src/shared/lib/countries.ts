import { COUNTRY_ROWS } from './countries.gen';

// The countries of the phone prefix picker (app_ui RegisterCountryCodePicker on country_code_picker):
// the package's list and names, the panel's favorites on top, and the search ranked by relevance.

export type CountryLocale = 'es' | 'ca' | 'en';

export type Country = { code: string; dial: string; name: string };

const NAME_INDEX: Record<CountryLocale, 2 | 3 | 4> = { es: 2, ca: 3, en: 4 };

/** Every country with its name in `locale`, in the package's order. */
export function countriesFor(locale: CountryLocale): Country[] {
  return COUNTRY_ROWS.map((row) => ({ code: row[0], dial: row[1], name: row[NAME_INDEX[locale]] }));
}

/** The country of an ISO code, or null. */
export function countryOf(code: string, locale: CountryLocale): Country | null {
  const row = COUNTRY_ROWS.find((candidate) => candidate[0] === code.toUpperCase());
  return row ? { code: row[0], dial: row[1], name: row[NAME_INDEX[locale]] } : null;
}

/** adminPhoneFavoriteDialCodes: every country with one of these dial codes, in the list's order. */
const FAVORITE_DIAL_CODES = ['+34', '+33', '+351', '+44', '+376', '+1', '+39'];

export function favoriteCountries(countries: readonly Country[]): Country[] {
  return countries.filter((country) => FAVORITE_DIAL_CODES.includes(country.dial));
}

// The `diacritic` package's removeDiacritics, enough for the country names: "Åland" is "Aland".
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();

const digits = (value: string) => value.replace(/\D/g, '');

/** countryMatchScore: lower is a stronger match; null is none. `query` is folded already. */
function matchScore(country: Country, query: string): number | null {
  const code = country.code.toUpperCase();
  const name = fold(country.name);
  const dial = country.dial;
  const queryDigits = digits(query);

  if (code === query) return 0;
  if (name === query) return 2;
  if (dial === query) return 4;
  if (queryDigits && digits(dial) === queryDigits) return 6;
  if (name.startsWith(query)) return 24;
  if (code.startsWith(query)) return 26;
  if (dial.startsWith(query)) return 28;
  if (name.split(/[\s,]+/).some((part) => part.startsWith(query))) return 34;
  const inName = name.indexOf(query);
  if (inName >= 0) return 110 + inName;
  const inCode = code.indexOf(query);
  if (inCode >= 0) return 210 + inCode;
  const inDial = dial.indexOf(query);
  if (inDial >= 0) return 310 + inDial;
  return null;
}

/**
 * The rows of the picker (`_listRows`): without a query, the favorites, then the rest; with one,
 * the matches by score, then by name. `dividerAfter` is the last favorite's index, or -1.
 */
export function countryPickerRows(
  countries: readonly Country[],
  query: string,
): { rows: Country[]; dividerAfter: number } {
  const folded = fold(query.trim());
  if (!folded) {
    const favorites = favoriteCountries(countries);
    const rest = countries.filter((country) => !favorites.includes(country));
    return { rows: [...favorites, ...rest], dividerAfter: rest.length > 0 ? favorites.length - 1 : -1 };
  }
  const rows = countries
    .map((country) => ({ country, score: matchScore(country, folded) }))
    .filter((entry): entry is { country: Country; score: number } => entry.score !== null)
    .sort(
      (a, b) =>
        a.score - b.score ||
        (fold(a.country.name) < fold(b.country.name)
          ? -1
          : fold(a.country.name) > fold(b.country.name)
            ? 1
            : 0),
    )
    .map((entry) => entry.country);
  return { rows, dividerAfter: -1 };
}
