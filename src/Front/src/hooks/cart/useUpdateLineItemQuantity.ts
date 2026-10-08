import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCart, useUserSession } from 'providers/index';
import { QUERY_KEYS } from 'constants/index';
import { getPickedProductFromBundleLine, isBundleLineItem } from 'utils/index';
import useAddToCart from './useAddToCart';
import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import useRemoveFromCart from './useRemoveFromCart';
import postCartUpdate from './postCartUpdate';
import type { AddToCartHit, CartLineItem } from 'types/index';

/**
 * B2B "set line-item quantity" (QTY-4 interim).
 *   - increase/decrease on an existing plain line → `changeLineItemQuantity` against that line's
 *     own id. (The service layer's `formatAddLineItemActions` forces every `addLineItem` onto a
 *     default custom type, which stops commercetools from merging it into the existing line for
 *     the same SKU — re-adding a delta instead creates a second, duplicate line item. A direct
 *     `changeLineItemQuantity` passes straight through that transform untouched.)
 *   - bundle lines → remove then re-add at the target quantity (commercetools rejects a second add
 *     of a bundle occurrence already in the cart, so there is no delta path for these)
 *   - zero → remove the line
 *
 * Because the B2B PLP row AND the on-page cart both read a line's quantity from the same
 * active cart, writing here makes both views reflect the change automatically (no local
 * state to keep in sync).
 *
 * CPQ carts are read-only everywhere (CTX-5): no surface, including the cart page and the mini
 * cart, may change a quoted line's quantity.
 * B2B-only (the PLP is gated).
 */
export default function useUpdateLineItemQuantity() {
  const { activeCart } = useCart();
  const { cartId } = useUserSession();
  const queryClient = useQueryClient();
  const { addToCartAsync, isAddingToCart } = useAddToCart();
  const { removeFromCartAsync, isRemovingFromCart } = useRemoveFromCart();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutateAsync: changeQuantityAsync, isPending: isChangingQuantity } = useMutation({
    mutationFn: (payload: { lineItemId: string; quantity: number }) =>
      postCartUpdate(
        {
          cartId,
          actions: [{ changeLineItemQuantity: payload }],
          authorizedBuyerPricingVoucher,
        },
        (errors) => {
          throw errors[0].message;
        }
      ),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart.id], updatedCart);
    },
  });

  const isCpqCart = Boolean(activeCart?.computed?.isB2B);
  const isReadOnly = isCpqCart;

  const updateQuantity = async (lineItem: CartLineItem, targetQty: number): Promise<void> => {
    if (isReadOnly) {
      return;
    }
    const current = lineItem.quantity;
    if (targetQty === current) {
      return;
    }

    if (targetQty <= 0) {
      await removeFromCartAsync({ lineItems: [lineItem] });
      return;
    }

    // A bundle cannot be re-added the way a plain line can. Its synthetic row's `variant.sku` is the
    // bundle's product KEY, and the cart service needs the bundle SKU plus the session that was
    // picked or it rejects the add (MISSING_PICKED_PRODUCTS_ON_PRODUCT_LEVEL_BUNDLE) — which is what
    // the old `{ sku }` payload silently did here. `allowMultiple` carries the same B2B opt-in the
    // listing's own add uses, so a re-add lands on the same occupancy rules it was added under.
    if (isBundleLineItem(lineItem)) {
      const picked = getPickedProductFromBundleLine(lineItem);
      // Increase and decrease alike: commercetools rejects a second add of a bundle occurrence
      // already in the cart, so there is no delta path here — remove it and re-add at the target.
      await removeFromCartAsync({ lineItems: [lineItem] });
      await addToCartAsync({
        items: [
          {
            sku: lineItem.bundleSku,
            ...(picked
              ? {
                  pickedProducts: [{ sku: picked.variant.sku, productKey: picked.productKey }],
                  allowMultiple: true,
                }
              : {}),
            quantity: targetQty,
          } as AddToCartHit,
        ],
        quantity: targetQty,
      });
      return;
    }

    await changeQuantityAsync({ lineItemId: lineItem.id, quantity: targetQty });
  };

  return {
    updateQuantity,
    isUpdatingQuantity: isAddingToCart || isRemovingFromCart || isChangingQuantity,
    isReadOnly,
  };
}
