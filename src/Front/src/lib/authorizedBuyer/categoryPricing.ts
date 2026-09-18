import type { AuthorizedBuyerCategoryPricing } from './types';

const normalizeCategory = (value: string): string => value.trim().toLowerCase();

export function resolveCategoryDiscount(
  categoryPricing: AuthorizedBuyerCategoryPricing[] | undefined,
  productCategory: string | null | undefined
): AuthorizedBuyerCategoryPricing | undefined {
  if (!productCategory || !categoryPricing?.length) {
    return undefined;
  }

  const normalizedTarget = normalizeCategory(productCategory);

  const exactMatch = categoryPricing.find(
    (entry) => normalizeCategory(entry.productCategory) === normalizedTarget
  );
  if (exactMatch) {
    return exactMatch;
  }

  const MAX_SHORT_CODE_LENGTH = 6;
  return categoryPricing.find((entry) => {
    const normalizedEntry = normalizeCategory(entry.productCategory);
    return (
      normalizedEntry.length > 0 &&
      normalizedEntry.length <= MAX_SHORT_CODE_LENGTH &&
      normalizedTarget.startsWith(normalizedEntry)
    );
  });
}
