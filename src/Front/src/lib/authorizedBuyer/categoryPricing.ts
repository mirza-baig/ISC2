import type { AuthorizedBuyerCategoryPricing } from './types';

export function resolveCategoryDiscount(
  categoryPricing: AuthorizedBuyerCategoryPricing[] | undefined,
  productCategory: string | null | undefined
): AuthorizedBuyerCategoryPricing | undefined {
  if (!productCategory || !categoryPricing?.length) {
    return undefined;
  }

  return categoryPricing.find((entry) => entry.productCategory === productCategory);
}
