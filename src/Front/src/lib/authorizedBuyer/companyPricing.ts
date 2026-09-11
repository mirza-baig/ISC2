import type { AuthorizedBuyerCategoryPricing } from './types';

export function resolveDisplayPriceCents(
  baseCents: number,
  categoryDiscount: AuthorizedBuyerCategoryPricing | undefined,
  companyPriceCents: number | undefined
): number {
  const tierCents = categoryDiscount
    ? Math.round(baseCents * (1 - categoryDiscount.discountPercent / 100))
    : baseCents;

  return companyPriceCents !== undefined ? Math.min(tierCents, companyPriceCents) : tierCents;
}
