import { Order } from 'types/index';
import { BUSINESS_PAYMENT_METHODS, CART_TYPE_ATTR, CART_TYPE_CPQ } from 'constants/index';
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

type OrderCustomField = {
  name: string;
  value?: unknown;
};

const customFieldText = (fields: OrderCustomField[], name: string): string => {
  const field = fields.find((item) => item.name === name);
  const value = field?.value;

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'string' ? parsed.trim() : trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

/**
 * True when this checkout order was placed for an organization.
 *
 * The confirmation page can render as soon as the order returns, which is before
 * shopper context has been restored. These custom fields are written only for that
 * business checkout, so the business confirmation can render from the order itself.
 * CPQ carts stay on the individual confirmation.
 */
export const isBusinessCheckoutOrder = (
  order?: {
    custom?: { customFieldsRaw?: OrderCustomField[] | null } | null;
    cartISC2?: { custom?: { customFieldsRaw?: OrderCustomField[] | null } | null } | null;
  } | null
): boolean => {
  if (!order) {
    return false;
  }

  const fields = [
    ...(order.custom?.customFieldsRaw ?? []),
    ...(order.cartISC2?.custom?.customFieldsRaw ?? []),
  ];

  if (customFieldText(fields, CART_TYPE_ATTR) === CART_TYPE_CPQ) {
    return false;
  }

  return (
    Boolean(customFieldText(fields, 'authorized-buyer-account-id')) ||
    customFieldText(fields, 'shopperContextType') === 'organization' ||
    Boolean(customFieldText(fields, 'organization'))
  );
};
