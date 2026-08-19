import { findCountryByNameOrShortName } from 'node-countries';

// if a new currency is added to Merchant Center, there must be an equal mappping added here (for now)
export enum CurrencyCodes {
  USD = 'USD',
  GBP = 'GBP',
  SGD = 'SGD',
  JPY = 'JPY',
  EUR = 'EUR',
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
};

export type CurrencyKey = keyof typeof DisplayCurrencyCodes;

export const getCurrencyByCountryCode = (country: string) => {
  const countryInfo = findCountryByNameOrShortName(country);

  if (countryInfo) {
    const [mainCurrency] = countryInfo.currencies;

    if (mainCurrency in CurrencyCodes) {
      return mainCurrency as CurrencyCodes;
    }
  }

  return CurrencyCodes.USD;
};
