import { BUSINESS_PAYMENT_METHODS } from 'constants/index';
import { Order } from 'types/index';

type PaymentIdentifier = {
  type: 'card' | 'google_wallet' | 'apple_pay';
  identifier: string;
};

export const maskPaymentIdentifier = (
  payment: PaymentIdentifier,
  maskChar = '*',
  digitsToKeep = 4
): string => {
  const identifier = payment.identifier.toString();

  const digitsToMask = identifier.length - digitsToKeep;

  const maskedSection = identifier.slice(0, digitsToMask).replace(/\d/g, maskChar);
  const visibleSection = identifier.slice(digitsToMask);

  return maskedSection + visibleSection;
};

/** Lower-cased and stripped of separators, so `Preapproved_Credit` matches `preapproved-credit`. */
const normalizePaymentMethod = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

// ─── Actual flow ──────────────────────────────────────────────────────────────────
// const BUSINESS_PAYMENT_METHOD_ALIASES: Record<string, BUSINESS_PAYMENT_METHODS> = {
//   preapprovedcredit: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
//   preapprovedcreditpayment: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
//   credit: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
//   prepaidaccount: BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
//   prepaid: BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
// };

// ─── TEMP-DEMO-ACTIVE ────────────────────────────────────────────────────────────
// Maps Stripe `card` onto preapproved credit so the conditional "Invoice Processing"
// step renders before the business payment story lands.
const BUSINESS_PAYMENT_METHOD_ALIASES: Record<string, BUSINESS_PAYMENT_METHODS> = {
  card: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
  preapprovedcredit: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
  preapprovedcreditpayment: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
  credit: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
  prepaidaccount: BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
  prepaid: BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
};

/**
 * Which business payment method the order was placed with, or null when it was placed with
 * one of the standard methods (card, PayPal, free).
 *
 * Both `method` and the localised `name` are checked because the value the service layer
 * writes for these methods is not settled yet — matching either keeps the confirmation
 * page's conditional step correct without a change here once it is. Aliases are matched
 * loosely on purpose; see BUSINESS_PAYMENT_METHOD_ALIASES.
 */
export const resolveBusinessPaymentMethod = (
  order: Pick<Order, 'paymentInfo'>
): BUSINESS_PAYMENT_METHODS | null => {
  const paymentMethodInfo = order.paymentInfo?.payments?.[0]?.paymentMethodInfo;

  if (!paymentMethodInfo) {
    return null;
  }

  const candidates = [paymentMethodInfo.method, paymentMethodInfo.name].filter(Boolean);

  for (const candidate of candidates) {
    const match = BUSINESS_PAYMENT_METHOD_ALIASES[normalizePaymentMethod(candidate)];

    if (match) {
      return match;
    }
  }

  return null;
};


