import { BUSINESS_PAYMENT_METHODS } from 'constants/checkout';

/**
 * Salesforce account flags arrive as Booleans or as Yes/No picklists
 * (`PO_Required__c` is a picklist; several others are checkboxes). A plain
 * truthiness check would treat the string "No" as true.
 */
export const isAccountFlagSet = (value?: boolean | string | null) => {
  if (typeof value === 'string') {
    return ['true', 'yes', '1'].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

/**
 * Account fields checkout uses to decide whether Prepaid / Preapproved Credit
 * may be offered. Optional throughout so a partial payload never throws.
 *
 * Cart total is the current commercetools total. Investment / deposit prepaid
 * accounts may also carry `discountPercentage`; that reduces the prepaid amount due.
 */
export type PaymentEligibilityAccount = {
  creditHold?: boolean | string | null;
  purchaseControls?: {
    prepaidAuthorized?: boolean | string | null;
  };
  credit?: {
    paymentTerms?: string | null;
    availableCredit?: number | string | null;
    creditLimit?: number | string | null;
    creditBalance?: number | string | null;
  };
  prepaid?: {
    expirationDate?: string | null;
    balance?: number | string | null;
    /** Salesforce prepaid account type. Discount applies for investment / deposit. */
    type?: string | null;
    /** MuleSoft field on prepaid. 0 / null means no discount. */
    discountPercentage?: number | string | null;
  } | null;
};

/** Salesforce sometimes sends money as a number, sometimes as a numeric string. */
export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

/**
 * Live Mule currently sends `creditLimit` and often leaves `availableCredit` /
 * `creditBalance` null. Prefer the explicit available amount; otherwise
 * `limit - balance`, then the limit alone.
 */
export const resolveAvailableCredit = (
  credit?: PaymentEligibilityAccount['credit'] | null
): number | null => {
  const available = toFiniteNumber(credit?.availableCredit);

  if (available !== null) {
    return available;
  }

  const limit = toFiniteNumber(credit?.creditLimit);

  if (limit === null) {
    return null;
  }

  const used = toFiniteNumber(credit?.creditBalance);

  return used === null ? limit : limit - used;
};

const DUE_ON_RECEIPT = 'dueonreceipt';

const normalizePicklist = (value?: string | null) =>
  (value || '').toLowerCase().replace(/[^a-z]/g, '');

const toDateOnly = (value: string | Date): Date | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());

  if (isoDate) {
    return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const todayDateOnly = (today: Date) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate());

/**
 * Enough funds to cover the cart. The story writes `>` but exact match must still
 * pay; treat "enough" as `>=`.
 */
export const hasEnoughAccountFunds = (available: number | null | undefined, cartTotal: number) =>
  typeof available === 'number' && Number.isFinite(available) && available >= cartTotal;

const PREPAID_DISCOUNT_TYPES = new Set(['investment', 'deposit']);

export const isPrepaidDiscountType = (type?: string | null) =>
  PREPAID_DISCOUNT_TYPES.has((type || '').toLowerCase().replace(/[^a-z]/g, ''));

/**
 * MuleSoft sends `discountPercentage` on investment and deposit prepaid accounts.
 * Use it only when it is present and greater than 0.
 */
export const resolvePrepaidDiscount = (
  prepaid?: PaymentEligibilityAccount['prepaid'] | null
): number | null => {
  const discount = toFiniteNumber(prepaid?.discountPercentage);

  if (discount === null || discount <= 0) {
    return null;
  }

  if (prepaid?.type && !isPrepaidDiscountType(prepaid.type)) {
    return null;
  }

  return discount;
};

/** Money taken off cart + tax when a prepaid discount applies. */
export const prepaidDiscountValue = (
  cartTotal: number,
  prepaid?: PaymentEligibilityAccount['prepaid'] | null
) => {
  const discount = resolvePrepaidDiscount(prepaid);

  if (discount === null) {
    return 0;
  }

  return cartTotal * (discount / 100);
};

/**
 * Amount prepaid must cover: cart + tax, minus discount when discountPercentage > 0.
 */
export const amountDueWithPrepaid = (
  cartTotal: number,
  prepaid?: PaymentEligibilityAccount['prepaid'] | null
) => Math.max(0, cartTotal - prepaidDiscountValue(cartTotal, prepaid));

/**
 * Prepaid is unexpired through the end of its expiration day.
 * A date of today is still usable.
 */
export const isPrepaidUnexpired = (expirationDate?: string | null, today: Date = new Date()) => {
  if (!expirationDate) {
    return false;
  }

  const expiration = toDateOnly(expirationDate);

  if (!expiration) {
    return false;
  }

  return expiration >= todayDateOnly(today);
};

export const isBuyerAuthorizedForPrepaid = (account?: PaymentEligibilityAccount | null) =>
  isAccountFlagSet(account?.purchaseControls?.prepaidAuthorized);

/**
 * Finance has preapproved the account for credit when Payment_Terms__c is present
 * and is not "Due on Receipt".
 */
export const isCreditPreapproved = (paymentTerms?: string | null) => {
  const normalized = normalizePicklist(paymentTerms);

  return Boolean(normalized) && normalized !== DUE_ON_RECEIPT;
};

export const isPrepaidAccountEligible = (
  account: PaymentEligibilityAccount | null | undefined,
  cartTotal: number,
  today: Date = new Date()
) => {
  if (!account?.prepaid) {
    return false;
  }

  return (
    isBuyerAuthorizedForPrepaid(account) &&
    isPrepaidUnexpired(account.prepaid.expirationDate, today) &&
    hasEnoughAccountFunds(
      toFiniteNumber(account.prepaid.balance),
      amountDueWithPrepaid(cartTotal, account.prepaid)
    )
  );
};

export const isPreapprovedCreditEligible = (
  account: PaymentEligibilityAccount | null | undefined,
  cartTotal: number
) => {
  if (!account || isAccountFlagSet(account.creditHold)) {
    return false;
  }

  return (
    isCreditPreapproved(account.credit?.paymentTerms) &&
    hasEnoughAccountFunds(resolveAvailableCredit(account.credit), cartTotal)
  );
};

export const isBusinessPaymentMethodEligible = (
  method: BUSINESS_PAYMENT_METHODS,
  account: PaymentEligibilityAccount | null | undefined,
  cartTotal: number,
  today: Date = new Date()
) => {
  if (method === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT) {
    return isPrepaidAccountEligible(account, cartTotal, today);
  }

  if (method === BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT) {
    return isPreapprovedCreditEligible(account, cartTotal);
  }

  return false;
};
