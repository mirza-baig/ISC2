export enum PAYMENT_METHODS {
  FREE = 'free',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  IDEAL = 'ideal',
  KLARNA = 'klarna',
  BLIK = 'blik',
}

/**
 * Payment methods offered only to business buyers.
 *
 * MuleSoft's Authorized Buyer payload says which of these an account may *use*
 * (`purchaseControls.prepaidAuthorized`, `credit.*`, `prepaid.*` in lib/authorizedBuyer);
 * it does not report which one a given order was placed with. That selection is read back
 * off the order's `paymentInfo.payments[].paymentMethodInfo.method` — see
 * `resolveBusinessPaymentMethod` in utils/order.
 */
export enum BUSINESS_PAYMENT_METHODS {
  PREAPPROVED_CREDIT = 'preapproved-credit',
  PREPAID_ACCOUNT = 'prepaid-account',
}

export enum CHECKOUT_STEPS {
  PERSONAL_INFORMATION = 'personal-information',
  PAYMENT_INFORMATION = 'payment-information',
}

export const PO_NUMBER_MAX_LENGTH = 30;

export const CUSTOMER_ORDER_REFERENCE_MAX_LENGTH = 75;

/** Salesforce Account type whose buyers must supply a course delivery date. */
export const OTP_ACCOUNT_TYPE = 'otp';

/**
 * commercetools product type names that make Course Delivery Date required for an
 * OTP account buyer. Matched lower-cased, like EXAM_PRODUCT_TYPES in constants/cart.
 *
 * Singular and plural are both listed because the naming is not consistent: live cart
 * data reports `Course` (singular, title case) while EXAM_PRODUCT_TYPES in
 * constants/cart uses `exams` / `exam prep`. Confirm the real exam and kit type names
 * against commercetools and trim this list once known.
 */
export const COURSE_DELIVERY_PRODUCT_TYPES = [
  'kit',
  'kits',
  'exam',
  'exams',
  'exam prep',
  'exam preps',
];

/**
 * The only Stripe payment method types approved for checkout.
 *
 * The PaymentIntent is created by the service layer with Stripe's automatic
 * payment methods, so the Payment Element renders whatever is switched on in the
 * Stripe Dashboard — a newly available payment option would otherwise appear at
 * checkout with no code change here. Every Stripe confirmation is validated
 * against this list before `stripe.confirmPayment` runs, so anything Stripe adds
 * is refused regardless of Dashboard or feature flag state.
 *
 * Values are Stripe payment method type IDs (snake_case), matching the `type`
 * reported by the Payment Element `change` event.
 */
export const APPROVED_STRIPE_PAYMENT_METHOD_TYPES = [
  'card',
  'bancontact',
  'ideal',
  'klarna',
] as const;

export type ApprovedStripePaymentMethodType = (typeof APPROVED_STRIPE_PAYMENT_METHOD_TYPES)[number];
