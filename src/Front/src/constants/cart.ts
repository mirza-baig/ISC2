export const STORE_KEY = 'valtech';

export const COUPON_MAX_LENGTH = 200;

export const FREE_PRICE = '0.00';

export const FEW_SEATS_THRESHOLD = 5;

export const DONATION_NAME = 'donation';

export const CART_ID_PARAM_NAME = 'cartId';

export const SUBSCRIPTION_PRODUCT_TYPES = ['candidate dues', 'amf'];

export const EXAM_PRODUCT_TYPES = ['exams', 'exam prep'];

/**
 * commercetools product type names that mark a line item as a private course. Matched
 * lower-cased, like EXAM_PRODUCT_TYPES above.
 *
 * A private course adds its own step to the business order confirmation's
 * "What Happens Next?" box, so a miss here silently drops that step.
 *
 * Confirm the real type name against commercetools and trim this list once known — the
 * same caveat COURSE_DELIVERY_PRODUCT_TYPES carries in constants/checkout.
 */

// ─── Actual flow ──────────────────────────────────────────────────────────────────
// export const PRIVATE_COURSE_PRODUCT_TYPES = ['private course', 'private courses'];

// ─── TEMP-DEMO-ACTIVE ────────────────────────────────────────────────────────────
// Counts an exam as a private course so the conditional "Private Courses" step renders
// with an ordinary test product, before the real type name is confirmed.
export const PRIVATE_COURSE_PRODUCT_TYPES = ['private course', 'private courses', 'exam', 'exams'];

export const CUSTOMER_GROUP_NAMES = {
  MEMBER: 'Members',
  CANDIDATE: 'Candidates',
  ASSOCIATE: 'Associates',
  NON_MEMBER: 'Non Members',
} as const;

export const TAX = 'tax';

export const CART_TYPE_ATTR = 'cartType';

export const CART_TYPE_CPQ = 'CPQ';

export const COMPANY_FIELDS = ['city', 'companyName', 'address', 'state', 'zipCode', 'country'];

export const LINE_ITEMS_ATTRIBUTES = [
  'name',
  'copy_name',
  'modality',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'time_zone',
  'time_zone_iana',
  'training_provider_',
  'division',
];

export const CART_ATTRIBUTES = ['tempOrderNumber', 'quoteExpiryDate', 'SFInvoiceNumber'];

export const BUNDLES_DISCOUNTS_NAME = 'BUNDLE-';
