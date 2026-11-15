import { CurrencyCodes, SUPPORTED_CURRENCIES, isCurrencyEnabled } from 'utils/currencies';

export const resolveAccountCurrency = (
  currency?: string | null,
  isCadEnabled = false
): CurrencyCodes | undefined => {
  const code = currency?.trim().toUpperCase();

  return code && SUPPORTED_CURRENCIES.includes(code) && isCurrencyEnabled(code, isCadEnabled)
    ? (code as CurrencyCodes)
    : undefined;
};
