export const DEFAULT_FRACTION_DIGITS = 2;

export type B2BCartTotalsInput = {
  isCpq: boolean;
  symbol: string;
  selfServeTotalDisplay: string;
  subtotal: number;
  fractionDigits: number;
  total: string | number;
  taxValue: string | number;
  taxesTbdLabel: string;
};

export type B2BCartTotals = {
  subtotalDisplay: string;
  taxesDisplay: string;
  totalDisplay: string;
  showTaxNote: boolean;
};

export const buildB2BCartTotals = ({
  isCpq,
  symbol,
  selfServeTotalDisplay,
  subtotal,
  fractionDigits,
  total,
  taxValue,
  taxesTbdLabel,
}: B2BCartTotalsInput): B2BCartTotals => {
  if (!isCpq) {
    return {
      subtotalDisplay: selfServeTotalDisplay,
      taxesDisplay: taxesTbdLabel,
      totalDisplay: selfServeTotalDisplay,
      showTaxNote: true,
    };
  }

  return {
    subtotalDisplay: `${symbol}${subtotal.toFixed(fractionDigits)}`,
    taxesDisplay: taxValue ? `${symbol}${taxValue}` : taxesTbdLabel,
    totalDisplay: `${symbol}${total}`,
    showTaxNote: !taxValue,
  };
};
