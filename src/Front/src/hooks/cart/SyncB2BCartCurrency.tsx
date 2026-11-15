import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

import { useCart } from 'providers/cart';
import { useUserSession } from 'providers/userSession';
import type { AddToCartHit, CartLineItem } from 'types/index';
import { getPickedProductFromBundleLine, isBundleLineItem } from 'utils/index';

import useAddToCart from './useAddToCart';
import useB2BCartAccess from './useB2BCartAccess';

let repriceToken: string | null = null;

const lineItemsToAddHits = (lineItems: CartLineItem[]): AddToCartHit[] | null => {
  const items = lineItems.map((lineItem): AddToCartHit | null => {
    if (isBundleLineItem(lineItem)) {
      const picked = getPickedProductFromBundleLine(lineItem);

      if (!lineItem.bundleSku || !picked?.variant?.sku || !picked.productKey) {
        return null;
      }

      return {
        sku: lineItem.bundleSku,
        quantity: lineItem.quantity,
        pickedProducts: [{ sku: picked.variant.sku, productKey: picked.productKey }],
        allowMultiple: true,
      };
    }

    if (!lineItem.variant?.sku) {
      return null;
    }

    return { sku: lineItem.variant.sku, quantity: lineItem.quantity };
  });

  if (items.some((item) => item === null)) {
    return null;
  }

  return items as AddToCartHit[];
};

/**
 * Reprices the open B2B cart after the shopper changes the currency selector.
 * Does nothing on first load, for "Myself", for CPQ quotes, and on checkout.
 */
export default function useSyncB2BCartCurrency(): void {
  const { asPath } = useRouter();
  const { activeCart, getCartSuccess } = useCart();
  const { currencyCode } = useUserSession();
  const { showB2BCart, isResolvingAccess } = useB2BCartAccess();
  const { addToCart } = useAddToCart();
  const cartRef = useRef(activeCart);
  const addToCartRef = useRef(addToCart);
  const initialized = useRef(false);

  cartRef.current = activeCart;
  addToCartRef.current = addToCart;

  useEffect(() => {
    if (!getCartSuccess || isResolvingAccess || !showB2BCart || !currencyCode) {
      return;
    }

    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    if (asPath.split('?')[0].includes('/checkout')) {
      return;
    }

    const cart = cartRef.current;

    if (cart?.computed?.isB2B) {
      return;
    }

    const lineItems = cart?.lineItems ?? [];
    const cartCurrency = cart?.computed?.currencyCode;

    if (!lineItems.length || !cartCurrency || cartCurrency === currencyCode) {
      return;
    }

    const items = lineItemsToAddHits(lineItems);

    if (!items?.length || !cart.id) {
      return;
    }

    const token = `${cart.id}:${currencyCode}`;

    if (repriceToken === token) {
      return;
    }

    repriceToken = token;
    addToCartRef.current(
      { items, skipAnalytics: true },
      {
        onSettled: () => {
          if (repriceToken === token) {
            repriceToken = null;
          }
        },
      }
    );
  }, [asPath, currencyCode, getCartSuccess, isResolvingAccess, showB2BCart]);
}
