import type { AuthorizedBuyerCategoryPricing } from './types';

export type AuthorizedBuyerPricingVoucherPayload = {
  v: 1;
  accountId: string;
  externalID: string;
  categoryPricing: AuthorizedBuyerCategoryPricing[];
  iat: number;
  exp: number;
};

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  return typeof window !== 'undefined'
    ? window.atob(padded)
    : Buffer.from(padded, 'base64').toString('utf-8');
};

export const decodeAuthorizedBuyerPricingVoucher = (
  voucher: string | undefined
): AuthorizedBuyerPricingVoucherPayload | undefined => {
  if (!voucher) {
    return undefined;
  }

  const encodedPayload = voucher.split('.')[0];
  if (!encodedPayload) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as AuthorizedBuyerPricingVoucherPayload;

    if (!payload?.exp || payload.exp * 1000 < Date.now()) {
      return undefined;
    }

    return payload;
  } catch {
    return undefined;
  }
};
