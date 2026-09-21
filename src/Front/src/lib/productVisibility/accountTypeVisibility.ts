export const ACCOUNT_TYPE_VISIBILITY_KEYS = {
  B2B: 'b2b',
  B2C: 'b2c',
  OTP: 'otp',
  IAP: 'iap',
  IRP: 'irp',
  FORMER_OTP: 'former-otp',
} as const;

export type AccountTypeVisibilityKey =
  (typeof ACCOUNT_TYPE_VISIBILITY_KEYS)[keyof typeof ACCOUNT_TYPE_VISIBILITY_KEYS];

export const normalizeAccountType = (accountType?: string | null): string =>
  typeof accountType === 'string' ? accountType.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

const ACCOUNT_TYPE_TO_VISIBILITY_KEY = new Map<string, AccountTypeVisibilityKey>([
  ['b2b', ACCOUNT_TYPE_VISIBILITY_KEYS.B2B],
  ['b2c', ACCOUNT_TYPE_VISIBILITY_KEYS.B2C],
  ['otp', ACCOUNT_TYPE_VISIBILITY_KEYS.OTP],
  ['iap', ACCOUNT_TYPE_VISIBILITY_KEYS.IAP],
  ['irp', ACCOUNT_TYPE_VISIBILITY_KEYS.IRP],
  ['formerotp', ACCOUNT_TYPE_VISIBILITY_KEYS.FORMER_OTP],
]);

export const resolveAccountTypeVisibilityKey = (
  accountType?: string | null
): AccountTypeVisibilityKey | null =>
  ACCOUNT_TYPE_TO_VISIBILITY_KEY.get(normalizeAccountType(accountType)) ?? null;

export const RECOGNISED_ACCOUNT_TYPE_TOKENS = [...ACCOUNT_TYPE_TO_VISIBILITY_KEY.keys()];
