import { findCountryByNameOrShortName } from 'node-countries';

// if a new currency is added to Merchant Center, there must be an equal mappping added here (for now)
export enum CurrencyCodes {
  USD = 'USD',
  GBP = 'GBP',
  SGD = 'SGD',
  JPY = 'JPY',
  EUR = 'EUR',
  CAD = 'CAD',
}

// if a new currency is added to Merchant Center, there must be a display mapping added here
export const getCurrencySymbol = (currencyCode: string) => {
  switch (currencyCode) {
    case CurrencyCodes.USD:
      return '\u0024';
    case CurrencyCodes.GBP:
      return '\u00A3';
    case CurrencyCodes.SGD:
      return 'S\u0024';
    case CurrencyCodes.JPY:
      return '\u00A5';
    case CurrencyCodes.EUR:
      return '\u20AC';
    // ITDEV-1641: "CA$" (not a bare "$") so CAD prices are never mistaken for USD.
    case CurrencyCodes.CAD:
      return 'CA$';
    default:
      return '\u0024';
  }
};

// if a new currency is added to Merchant Center, there must be a display mapping added here
export const DisplayCurrencyCodes: { [name: string]: string } = {
  USD: `${CurrencyCodes.USD} ${getCurrencySymbol(CurrencyCodes.USD)}`,
  GBP: `${CurrencyCodes.GBP} ${getCurrencySymbol(CurrencyCodes.GBP)}`,
  SGD: `${CurrencyCodes.SGD} ${getCurrencySymbol(CurrencyCodes.SGD)}`,
  JPY: `${CurrencyCodes.JPY} ${getCurrencySymbol(CurrencyCodes.JPY)}`,
  EUR: `${CurrencyCodes.EUR} ${getCurrencySymbol(CurrencyCodes.EUR)}`,
  // The "CAD" code already disambiguates, so the selector shows a plain "$" rather than "CAD CA$".
  CAD: `${CurrencyCodes.CAD} $`,
};

export type CurrencyKey = keyof typeof DisplayCurrencyCodes;

// Currencies we can actually take payment in - mirrors `SUPPORTED_CURRENCIES` in
// us-ecom-infrastructureComponents/ct-graphql-service-cart/contants.ts (one entry per configured
// Stripe account). `CurrencyCodes` above is broader on purpose - e.g. JPY has catalog/search-facet
// pricing (see priceBuckets.ts) without being purchasable - so this list, not that enum, is what
// gates a currency ever being auto-applied to a session (ITDEV-384: geolocation was applying JPY
// via the enum-membership check this replaces, with no Stripe account behind it).
export const SUPPORTED_CURRENCIES: string[] = [
  CurrencyCodes.USD,
  CurrencyCodes.GBP,
  CurrencyCodes.SGD,
  CurrencyCodes.EUR,
  // ITDEV-1637: also makes CAD the geolocated default for Canadian visitors (getCurrencyByCountryCode).
  CurrencyCodes.CAD,
];

// CAD stays dormant until this flag is Enabled in the Feature Flags item
// (/sitecore/content/ISC2/Main/Data/Feature Flags Folder/Feature Flags). The name must match the
// Sitecore row exactly; a missing or Disabled row reads as false, so CAD is off by default.
export const CAD_CURRENCY_FEATURE_FLAG = 'CAD_Currency';

// True when the currency may be offered or applied. Only CAD is gated; every other code passes.
export const isCurrencyEnabled = (currency: string | undefined, isCadEnabled: boolean) =>
  currency !== CurrencyCodes.CAD || isCadEnabled;

// Swaps a gated-off currency for USD so CAD never reaches a session while the flag is off.
export const toEnabledCurrency = (
  currency: CurrencyCodes | undefined,
  isCadEnabled: boolean
): CurrencyCodes | undefined =>
  isCurrencyEnabled(currency, isCadEnabled) ? currency : CurrencyCodes.USD;

// `isCadEnabled` defaults to false so a caller that has no flag access can never default to CAD.
export const getCurrencyByCountryCode = (country: string, isCadEnabled = false) => {
  const countryInfo = findCountryByNameOrShortName(country);

  if (countryInfo) {
    const [mainCurrency] = countryInfo.currencies;

    if (
      SUPPORTED_CURRENCIES.includes(mainCurrency) &&
      isCurrencyEnabled(mainCurrency, isCadEnabled)
    ) {
      return mainCurrency as CurrencyCodes;
    }
  }

  return CurrencyCodes.USD;
};
