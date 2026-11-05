import { CurrencyCodes, SUPPORTED_CURRENCIES } from 'utils/currencies';

export const resolveAccountCurrency = (currency?: string | null): CurrencyCodes | undefined => {
  const code = currency?.trim().toUpperCase();

  return code && SUPPORTED_CURRENCIES.includes(code) ? (code as CurrencyCodes) : undefined;
};
