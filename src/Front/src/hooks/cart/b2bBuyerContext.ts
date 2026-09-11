export type BuyerContext = 'Myself' | 'Organization';

export const DEFAULT_CART_HREF = '/cart';

export const resolveBuyerContext = (
  shopperContextType: 'myself' | 'organization' | null | undefined
): BuyerContext | null => {
  if (shopperContextType === 'myself') {
    return 'Myself';
  }

  if (shopperContextType === 'organization') {
    return 'Organization';
  }

  return null;
};

/**
 * Quantity editing is an Authorized Buyer privilege for organization shopping.
 * "Myself" matches a standard individual user (static quantity, no steppers).
 */
export const canEditQuantityForBuyerContext = (
  isAuthorizedBuyer: boolean,
  buyerContext: BuyerContext | null
): boolean => isAuthorizedBuyer && buyerContext !== 'Myself';

/**
 * Organization Authorized Buyers skip the cart page from the Mini Cart.
 * "Myself" (and non-buyers) go to `/cart` first, like a standard individual user.
 */
export const shouldMiniCartGoToCheckout = (
  isAuthorizedBuyer: boolean,
  buyerContext: BuyerContext | null
): boolean => isAuthorizedBuyer && buyerContext !== 'Myself';

export const resolveMiniCartCartHref = (checkoutCtaHref?: string | null): string =>
  checkoutCtaHref || DEFAULT_CART_HREF;

export type MiniCartNavigation = {
  destination: string;
  skipToCheckout: boolean;
};

export const resolveMiniCartNavigation = (
  isAuthorizedBuyer: boolean,
  buyerContext: BuyerContext | null,
  checkoutCtaHref?: string | null
): MiniCartNavigation => {
  const skipToCheckout = shouldMiniCartGoToCheckout(isAuthorizedBuyer, buyerContext);

  return {
    skipToCheckout,
    destination: skipToCheckout ? '/checkout' : resolveMiniCartCartHref(checkoutCtaHref),
  };
};
