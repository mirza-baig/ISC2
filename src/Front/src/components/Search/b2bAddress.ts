import { POSTAL_CODES_PATTERNS } from 'constants/postalCodesPatterns';
import { COUNTRIES_REQUIRING_STATES } from 'types/users';
import type { QueryResponse as AllStates } from 'hooks/configuration/useGetAllStates';
import type { Country, State, UserAddress } from 'types/index';

/**
 * Address rules + formatting shared by the B2B private-class "Classroom Location" modal.
 *
 * Everything here deliberately defers to what checkout already does rather than restating it, so the
 * two can't drift: the country and state lists are the same Mulesoft-backed `useGetAllCountries` /
 * `useGetAllStates` data checkout's dropdowns use, the postal-code rules are the same
 * `POSTAL_CODES_PATTERNS` table, and the "which countries must have a state" rule is checkout's own
 * `COUNTRIES_REQUIRING_STATES` (imported, not copied — if checkout adds a country, this follows).
 *
 * Why this exists at all: the modal used to collect a flat set of free-text fields with Country
 * pre-filled to the literal string "United States" and City/State/Zip all unconditionally required,
 * which made a non-US address impossible to enter correctly — most of the world has no "state", and
 * plenty of countries have no postal code at all.
 */

/** Codes, not names — same shape checkout persists, so a state/country can be resolved and re-shown. */
export interface AddressCustomFields {
  /** Street line 1 — checkout's `street`. */
  address1: string;
  /** Street line 2. Not a checkout field (it has a label but never renders one); always optional. */
  address2: string;
  city: string;
  /** ISO state/province CODE, '' when the country has no state list. */
  stateCode: string;
  /** ISO country CODE (e.g. 'US'), '' until chosen. */
  countryCode: string;
  /** Postal/ZIP code — required and pattern-checked only where the country has a pattern. */
  zip: string;
}

export const EMPTY_CUSTOM_ADDRESS: AddressCustomFields = {
  address1: '',
  address2: '',
  city: '',
  stateCode: '',
  countryCode: '',
  zip: '',
};

/** The state list for a country, or `[]` when that country has none (most of the world). */
export const getStatesForCountry = (
  allStates: AllStates | undefined,
  countryCode: string
): State[] => (countryCode && allStates?.[countryCode]) || [];

/**
 * Does this country use postal codes? `POSTAL_CODES_PATTERNS` maps the ones that don't to `null`
 * (Angola, Bahamas, Botswana…), and omits anything unknown — both mean "don't ask for one".
 */
export const getPostalCodePattern = (countryCode: string): RegExp | null =>
  POSTAL_CODES_PATTERNS[countryCode?.toUpperCase() as keyof typeof POSTAL_CODES_PATTERNS] ?? null;

/**
 * Is a state/province mandatory for this country? Checkout enforces it for `COUNTRIES_REQUIRING_STATES`
 * only (US today); the extra list check keeps it from being required when there is nothing to pick.
 */
export const isStateRequired = (countryCode: string, allStates: AllStates | undefined): boolean =>
  COUNTRIES_REQUIRING_STATES.includes(countryCode.trim().toUpperCase()) &&
  getStatesForCountry(allStates, countryCode).length > 0;

/**
 * Validation, matching checkout's `AddressSchema` field for field: street/city/country always
 * required; state required only where checkout requires it AND the country actually has a list to
 * pick from; postal code required and pattern-matched only where the country has a pattern. Returns
 * the offending field keys so the modal can mark them, rather than a bare boolean.
 */
export const getAddressErrors = (
  address: AddressCustomFields,
  allStates: AllStates | undefined
): Partial<Record<keyof AddressCustomFields, 'required' | 'invalid'>> => {
  const errors: Partial<Record<keyof AddressCustomFields, 'required' | 'invalid'>> = {};
  const countryCode = address.countryCode.trim();

  if (!address.address1.trim()) {
    errors.address1 = 'required';
  }
  if (!address.city.trim()) {
    errors.city = 'required';
  }
  if (!countryCode) {
    errors.countryCode = 'required';
  }

  if (isStateRequired(countryCode, allStates) && !address.stateCode.trim()) {
    errors.stateCode = 'required';
  }

  const pattern = getPostalCodePattern(countryCode);
  const zip = address.zip.trim();
  if (pattern) {
    // A country with a pattern always needs a postal code; a country without one never does, so an
    // empty zip is only an error in the first case — and a filled-in one is only checked there too.
    errors.zip = zip ? (pattern.test(zip) ? undefined : 'invalid') : 'required';
    if (!errors.zip) {
      delete errors.zip;
    }
  }

  return errors;
};

const joinParts = (parts: (string | undefined)[], separator = ', '): string =>
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(separator);

/**
 * One-line display string, e.g. "12 Rue de Rivoli, Paris, 75001, France" or
 * "456 Member Lane, Suite 100, Clearwater, FL 33755, United States".
 *
 * International-safe because every part is optional and empty ones drop out: no state segment for a
 * country without states, no postal segment for a country without postal codes. State and country
 * are shown by NAME (resolved from the same lists the dropdowns use) but stored by code, so the text
 * reads naturally without the stored value having to. Falls back to the code if a list hasn't loaded
 * yet, which is still better than showing nothing.
 */
export const formatCustomAddress = (
  address: AddressCustomFields,
  allCountries: Country[] | undefined,
  allStates: AllStates | undefined
): string => {
  const stateName = getStatesForCountry(allStates, address.countryCode).find(
    (s) => s.stateCode === address.stateCode
  )?.stateName;
  const countryName = allCountries?.find((c) => c.countryCode === address.countryCode)?.countryName;

  return joinParts([
    address.address1,
    address.address2,
    address.city,
    // "FL 33755" reads as one unit, space-separated rather than comma-separated; either half can be
    // absent (no state, or no postal code), in which case only the other one shows.
    joinParts([stateName || address.stateCode, address.zip], ' '),
    countryName || address.countryCode,
  ]);
};

/**
 * The signed-in user's mailing/billing address, formatted the same way. `UserAddress` already
 * carries both the codes and the names, so the name is preferred and the code is the fallback —
 * again with every part optional, so a country with no state or no postal code doesn't leave a
 * stray comma behind.
 */
export const formatUserAddress = (
  address: UserAddress | undefined,
  allStates: AllStates | undefined
): string => {
  if (!address) {
    return '';
  }
  const stateName =
    address.state ||
    getStatesForCountry(allStates, address.countryCode).find(
      (s) => s.stateCode === address.stateCode
    )?.stateName ||
    address.stateCode;

  return joinParts([
    address.street,
    address.city,
    joinParts([stateName, address.postalCode], ' '),
    address.country || address.countryCode,
  ]);
};
