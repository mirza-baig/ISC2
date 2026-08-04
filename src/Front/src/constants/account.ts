export enum ORDER_STATUS {
  open = 'open',
  confirmed = 'confirmed',
  complete = 'complete',
  completed = 'completed',
  closed = 'closed',
  cancelled = 'cancelled',
  returned = 'returned',
  refunded = 'refunded',
  failed = 'failed',
}

export enum STATUS_PILL_STYLES {
  success = 'success-pill',
  warning = 'warning-pill',
}

// contact information form dropdown options
export const PREFIX_OPTIONS = [
  'Dr.',
  'Mr.',
  'Mrs.',
  'Ms.',
  'Prof.',
  'Col.',
  'Maj.',
  'Capt.',
  'Lt. Col.',
];

export const SUFFIX_OPTIONS = ['II', 'III', 'IV', 'Jr.'];

export const PRONOUNS_OPTIONS = [
  'She/her',
  'He/his',
  'They/their',
  'Not listed',
  'Prefer not to answer',
];

export const NONE_SELECTED = {
  name: '',
  value: '',
};

export enum SUBSCRIPTION_STATUS {
  active = 'active',
  pending = 'pending',
  expired = 'expired',
  cancelled = 'cancelled',
  suspended = 'suspended',
  cpenotcomplete = 'cpenotcomplete',
}

export enum SUBSCRIPTION_PAYMENT_STATUS {
  due = 'due',
  pastDue = 'past due',
  notDue = 'not due',
}

export enum SUBSCRIPTION_AMF_TYPE {
  candidate = 'candidate',
  cc = 'cc',
  associate = 'associate',
  professional = 'professional',
  upgrade = 'upgrade',
}

export enum AWARD_TYPES {
  certifications = 'certifications',
  badges = 'badges',
}

export enum AWARD_CARD_TYPES {
  list = 'list',
  single = 'single',
}

export const ALLOCATION_ID = 'allocationId';
export const ALLOCATION_DETAIL_PRODUCT_SKU = 'productSku';

export const ALLOCATION_DETAIL_ORDER_NUMBER = 'orderNumber';

export const ALLOCATION_USER_STATUSES = [
  'isCancelled',
  'isExpired',
  'isFailedToAllocate',
  'isAvailableToAllocate',
  'isAccepted',
  'isRedeemed',
  'isAllocated',
  'emailAlreadyAllocated',
] as const;

export const ALLOCATION_USER_SUCCESS_STATUSES = ['isAccepted', 'isRedeemed'];

export const ALLOCATION_USER_ERROR_STATUSES = [
  'isCancelled',
  'isExpired',
  'isFailedToAllocate',
  'emailAlreadyAllocated',
];

export const ACTION_NEED_ERRORS = ['isFailedToAllocate'];

export const ACTION_NOT_NEED_ERRORS = ['emailAlreadyAllocated', 'isCancelled', 'isExpired'];

// check for items which should not match both flags
export const NO_ACTIONS_ALLOWED = ['isAvailableToAllocate', 'isAllocated'];

export const ALLOCATION_SEARCH_LENGTH = 3;

export const CERTIFICATION_STATUS_MAINTENANCE = 'Maintenance';

export const EXTERNAL_ID_LENGTH = 30;
