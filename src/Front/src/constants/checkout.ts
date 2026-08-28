export enum PAYMENT_METHODS {
  FREE = 'free',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  IDEAL = 'ideal',
  KLARNA = 'klarna',
  BLIK = 'blik',
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
 * Fallbacks for the business buyer step one copy. Sitecore authors override these by
 * adding the matching keys to the checkout item's "Step One Labels, Tooltips And More"
 * field; until then the checkout renders the agreed copy.
 */
export const BUSINESS_STEP_ONE_DEFAULT_LABELS = {
  pageHeadline: 'Purchase Information',
  stepTitle: 'Purchase Information',
  companyInformationTitle: 'Company Information',
  contactInformationTitle: 'Contact Information',
  poNumberLabel: 'PO Number',
  poAttachmentLabel: 'PO Attachment',
  customerOrderReferenceLabel: 'Customer order reference',
  customerOrderReferenceTooltip:
    'This text will be added to the order history and documents for your reference.',
  courseDeliveryDateLabel: 'Course Delivery Date',
  courseDeliveryDateTooltip: 'Please enter the course delivery date for your kit or exam purchase.',
} as const;

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

export const isBusinessAccountPaymentMethod = (
  method?: string
): method is BUSINESS_PAYMENT_METHODS =>
  method === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT ||
  method === BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT;

/**
 * Fallbacks for business payment-method copy on checkout step two.
 */
export const BUSINESS_STEP_TWO_DEFAULT_LABELS = {
  paymentMethodSelectLabel: 'Please choose a payment method',
  creditCardOptionLabel: 'Credit Card',
  prepaidAccountLabel: 'Prepaid Account Payment',
  prepaidAccountDescription: 'Process this order from a prepaid investment or deposit account.',
  preapprovedCreditLabel: 'Preapproved Credit Payment',
  preapprovedCreditDescription:
    "Request an invoice subject to your account's pre-approved credit terms.",
  prepaidAvailableBalanceLabel: 'Available prepaid balance',
  creditAvailableBalanceLabel: 'Available credit',
  prepaidDiscountLabel: 'Discount',
  prepaidAmountDueLabel: 'Amount due with prepaid',
  staleBusinessPaymentMessage:
    'This payment method is no longer available. Please choose another payment method and try again.',
} as const;
