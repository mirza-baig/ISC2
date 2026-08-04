export const ALLOCATION_FLOW = 'Allocations';

export enum PRODUCT_REDEEM_MODAL_STATUS {
  Default = 'default',
  Cancel = 'cancel',
  Consent = 'consent',
  Redeemed = 'redeemed',
  Schedule = 'schedule',
  Closed = 'closed',
}

export enum PRODUCT_REDEEM_MODAL_ERRORS {
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  ALREADY_ACCEPTED = 'ALREADY_ACCEPTED',
  ALREADY_REDEEMED = 'ALREADY_REDEEMED',
  WRONG_ID = 'WRONG_ID',
  NO_CONSENT = 'NO_CONSENT',
  DEFAULT = 'DEFAULT',
}

export const ALLOCATED_FIELDS = ['accepted', 'allocated', 'redeemed', 'failedToAllocate'];

export enum ALLOCATION_TERMS_AND_CONDITIONS {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}
