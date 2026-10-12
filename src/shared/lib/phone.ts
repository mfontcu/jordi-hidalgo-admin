import { parsePhoneNumberWithError, type CountryCode, type PhoneNumber } from 'libphonenumber-js/max';

// Phone numbers as the customer app and the Flutter panel take them (app_core
// utils/phone_number.dart, on phone_numbers_parser): parsed and validated with full metadata, so a
// number must match its country's patterns, not only its length. Countries are ISO 3166-1 alpha-2
// codes ('ES'); the default is Spain.

export const DEFAULT_PHONE_COUNTRY = 'ES';

/** A number, or null when it does not parse or is not a valid number. */
function parseValid(text: string, country?: string): PhoneNumber | null {
  try {
    const parsed = parsePhoneNumberWithError(text, country as CountryCode | undefined);
    return parsed.isValid() ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * phone_numbers_parser's `PhoneNumber.parse` without a country: the text is international, so
 * digits without a "+" start with their country code.
 */
function parseWithoutCountry(text: string): PhoneNumber | null {
  return parseValid(text.startsWith('+') ? text : `+${text.replace(/\D/g, '')}`);
}

/**
 * tryParseRegisterPhone: with a leading "+" or "00", an international number of any country;
 * without one, a national number of `country`, then an international number without its "+".
 */
export function parsePhone(raw: string, country: string = DEFAULT_PHONE_COUNTRY): PhoneNumber | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const collapsed = trimmed.replace(/[\s\-.()]/g, '');
  if (collapsed.startsWith('00') && collapsed.length > 4) return parseValid(`+${collapsed.slice(2)}`);
  if (trimmed.startsWith('+')) return parseValid(trimmed);
  return parseValid(trimmed, country) ?? parseWithoutCountry(trimmed);
}

/** phoneInternationalE164OrNull: the E.164 number ("+34600123456"), or null when it is invalid. */
export function phoneE164OrNull(raw: string, country: string = DEFAULT_PHONE_COUNTRY): string | null {
  return parsePhone(raw, country)?.number ?? null;
}

export type PhoneFieldError = 'empty' | 'invalid';

/** validatePhoneField: what is wrong with a number, or null. */
export function validatePhone(raw: string, country: string = DEFAULT_PHONE_COUNTRY): PhoneFieldError | null {
  if (!raw.trim()) return 'empty';
  return parsePhone(raw, country) ? null : 'invalid';
}

/**
 * phone_numbers_parser's `formatNsn`: the national number grouped as the country writes it,
 * without the national prefix ("6 12 34 56 78" for +33612345678, where the national format reads
 * "06 12 34 56 78").
 */
function formatNsn(phone: PhoneNumber): string {
  const formatted = phone.formatNational();
  let extra = formatted.replace(/\D/g, '').length - phone.nationalNumber.length;
  let index = 0;
  while (extra > 0 && index < formatted.length) {
    if (/\d/.test(formatted.charAt(index))) extra -= 1;
    index += 1;
  }
  return formatted.slice(index).trim();
}

/**
 * splitStoredPhone: a stored number split into its country and national number for the prefix
 * picker. One that does not parse keeps its text, with the default country.
 */
export function splitStoredPhone(raw: string): { country: string; national: string } {
  const trimmed = raw.trim();
  const parsed = trimmed ? parseWithoutCountry(trimmed) : null;
  if (!parsed?.country) return { country: DEFAULT_PHONE_COUNTRY, national: trimmed };
  return { country: parsed.country, national: formatNsn(parsed) };
}

/**
 * The digits of two numbers are the same (`_samePhone` in the client form): an unchanged phone
 * skips the duplicate check.
 */
export function samePhone(left: string, right: string): boolean {
  const normalize = (value: string) => value.replace(/[^0-9+]/g, '');
  return normalize(left) !== '' && normalize(left) === normalize(right);
}
