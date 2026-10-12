import { useMemo, useState, type ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';
import { countriesFor, countryOf, countryPickerRows, type CountryLocale } from '@/shared/lib/countries';

import { Icon } from '../icons/icon';
import { Button } from '../primitives/button';
import { fieldBase } from '../primitives/field-styles';
import { Input } from '../primitives/input';
import { Popover, PopoverAnchor, PopoverContent } from '../primitives/popover';
import { Sheet, SheetContent, SheetTitle } from '../primitives/sheet';
import { useWindowNarrowerThan } from './date-pickers';

// The flags of country_code_picker (scripts/countries-import.mjs), loaded as files when shown.
const FLAGS = import.meta.glob<string>('./flags/*.png', { eager: true, query: '?url', import: 'default' });
const flagUrl = (code: string) => FLAGS[`./flags/${code.toLowerCase()}.png`];

export type PhoneFieldLabels = {
  /** Title of the country sheet ("Selecciona país"). */
  pickerTitle: string;
  /** Hint of its search field. */
  pickerSearch: string;
  /** When no country matches the search. */
  pickerEmpty: string;
  close: string;
  /** Names the prefix button, with the selected country and its dial code. */
  changeCountry: (country: string) => string;
};

type PhoneFieldProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  /** The national number as typed. */
  value: string;
  onValueChange: (value: string) => void;
  /** ISO 3166-1 alpha-2 code of the prefix. */
  country: string;
  onCountryChange: (country: string) => void;
  locale: CountryLocale;
  labels: PhoneFieldLabels;
};

// The characters the Flutter field lets through (FilteringTextInputFormatter), up to 32.
const ALLOWED = /[^0-9+\s\-.()]/g;
const MAX_LENGTH = 32;

/**
 * AdminPhoneField: the national number with the country prefix in front, which opens the country
 * picker: a bottom sheet under 700px, as in Flutter, and a panel under the field on wider screens,
 * like the list filters (approved change). Read-only fields show the stored number as an ordinary
 * field, without the prefix.
 */
export function PhoneField({
  value,
  onValueChange,
  country,
  onCountryChange,
  locale,
  labels,
  className,
  readOnly,
  ...props
}: PhoneFieldProps) {
  const [open, setOpen] = useState(false);
  const narrow = useWindowNarrowerThan(700);
  const selected = countryOf(country, locale);

  if (readOnly) {
    // AdminUserProfileTextField: filled on the muted surface.
    return (
      <Input
        type="tel"
        value={value}
        readOnly
        className={cn('bg-surface-muted', className)}
        onChange={() => undefined}
        {...props}
      />
    );
  }

  const pick = (code: string) => {
    setOpen(false);
    onCountryChange(code);
  };
  const close = () => {
    setOpen(false);
  };
  const prefix = (
    <button
      type="button"
      aria-label={labels.changeCountry(selected ? `${selected.name} ${selected.dial}` : country)}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setOpen(true);
      }}
      // The prefix (RegisterCountryCodePicker builder): an 8px inset, the 26×18 flag with 3px
      // corners, 6px, the dial code (14/w600), and the drop-down arrow; 4px after it.
      className="ml-[7px] flex shrink-0 cursor-pointer items-center rounded-xs pr-1 hover:bg-surface-muted"
    >
      {selected && (
        <>
          <img src={flagUrl(selected.code)} alt="" className="h-[18px] w-[26px] rounded-[3px] object-cover" />
          <span className="ml-1.5 text-[14px] font-semibold tracking-normal text-on-surface">
            {selected.dial}
          </span>
        </>
      )}
      <Icon name="arrow_drop_down_rounded" size={22} className="text-content-secondary" />
    </button>
  );
  const field = (
    <div
      className={cn(
        fieldBase,
        // The field look on the wrapper; the input inside draws nothing of its own.
        'flex items-center p-0 focus-within:border-focus focus-within:shadow-[inset_0_0_0_0.4px_var(--focus)]',
        'has-[input[aria-invalid=true]]:border-error',
        className,
      )}
    >
      {prefix}
      <input
        type="tel"
        inputMode="tel"
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(event) => {
          onValueChange(event.target.value.replace(ALLOWED, '').slice(0, MAX_LENGTH));
        }}
        className="min-w-0 flex-1 bg-transparent py-(--input-padding-y) pr-[19px] pl-[5px] text-body-lg text-on-surface outline-none placeholder:text-on-surface-muted"
        {...props}
      />
    </div>
  );

  if (narrow) {
    return (
      <>
        {field}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            handle={false}
            aria-describedby={undefined}
            overlayClassName="bg-black/38"
            className="h-[85dvh] overflow-hidden rounded-t-[14px]"
          >
            <div className="flex justify-end">
              <Button
                variant="icon"
                aria-label={labels.close}
                onClick={close}
                className="[&_svg]:size-[22px]"
              >
                <Icon name="close" size={22} />
              </Button>
            </div>
            <SheetTitle className="px-6 pb-1.5 text-title-md font-bold">{labels.pickerTitle}</SheetTitle>
            <CountryList locale={locale} labels={labels} onPick={pick} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{field}</PopoverAnchor>
      <PopoverContent
        role="dialog"
        aria-label={labels.pickerTitle}
        className="flex h-[440px] w-[400px] flex-col overflow-hidden p-0 pt-5"
      >
        <p className="px-6 pb-1.5 text-title-md font-bold text-on-surface">{labels.pickerTitle}</p>
        <CountryList locale={locale} labels={labels} onPick={pick} />
      </PopoverContent>
    </Popover>
  );
}

type CountryListProps = {
  locale: CountryLocale;
  labels: PhoneFieldLabels;
  onPick: (code: string) => void;
};

/**
 * The body of `_RegisterCountryPickSheet`: the search, which starts focused, and the countries,
 * the favorites first. The query starts empty each time the picker opens.
 */
function CountryList({ locale, labels, onPick }: CountryListProps) {
  const [query, setQuery] = useState('');
  const countries = useMemo(() => countriesFor(locale), [locale]);
  const { rows, dividerAfter } = countryPickerRows(countries, query);

  return (
    <>
      <div className="relative px-6">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-[42px] -translate-y-1/2 text-on-surface-variant"
        />
        <input
          type="search"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- the sheet opens to search, as in Flutter.
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={labels.pickerSearch}
          aria-label={labels.pickerSearch}
          className={cn(
            'h-12 w-full rounded-[14px] border border-outline-variant bg-surface pr-4 pl-11 text-body-lg text-on-surface outline-none',
            'placeholder:text-on-surface-muted focus-visible:border-2 focus-visible:border-focus focus-visible:pl-[43px]',
            '[&::-webkit-search-cancel-button]:hidden',
          )}
        />
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="flex h-full items-center justify-center text-body-lg text-on-surface">
            {labels.pickerEmpty}
          </p>
        ) : (
          <ul>
            {rows.map((country, index) => {
              const label = `${country.dial} ${country.name}`;
              return (
                <li key={country.code} className={cn(index === dividerAfter && 'border-b border-border')}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(country.code);
                    }}
                    className="flex w-full cursor-pointer items-center px-5 py-2.5 text-left hover:bg-surface-muted"
                  >
                    <img
                      src={flagUrl(country.code)}
                      alt=""
                      loading="lazy"
                      className="mr-3 w-[22px] shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-normal text-on-surface-secondary">
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
