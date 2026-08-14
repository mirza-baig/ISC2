import { useCart } from 'providers/index';
import { getPickedProductFromBundleLine, isBundleLineItem } from 'utils/index';
import useAddToCart from './useAddToCart';
import useRemoveFromCart from './useRemoveFromCart';
import type { AddToCartHit, CartLineItem, ProductHit as AddToCartProductHit } from 'types/index';

/**
 * B2B PLP "set line-item quantity" (QTY-4 interim). There is no native
 * `changeLineItemQuantity` op in the service layer, so we set a line's quantity using the
 * existing add/remove mechanisms:
 *   - increase → add the delta (single mutation, reuses the working add path)
 *   - decrease → remove the line, then re-add at the target quantity
 *   - zero     → remove the line
 *
 * Because the B2B PLP row AND the on-page cart both read a line's quantity from the same
 * active cart, writing here makes both views reflect the change automatically (no local
 * state to keep in sync).
 *
 * CPQ carts are never modified (CTX-5): if the active cart is a CPQ/B2B cart this is a no-op.
 * B2B-only (the PLP is gated).
 */
export default function useUpdateLineItemQuantity() {
  const { activeCart } = useCart();
  const { addToCartAsync, isAddingToCart } = useAddToCart();
  const { removeFromCartAsync, isRemovingFromCart } = useRemoveFromCart();

  const isReadOnly = Boolean(activeCart?.computed?.isB2B);

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

    const sku = lineItem.variant?.sku;
    if (!sku) {
      return;
    }

    const addAtQuantity = (quantity: number) =>
      addToCartAsync({ items: [{ sku } as unknown as AddToCartProductHit], quantity });

    if (targetQty > current) {
      await addAtQuantity(targetQty - current);
      return;
    }

    // Decrease: no native set/decrement op — remove then re-add at the target.
    await removeFromCartAsync({ lineItems: [lineItem] });
    await addAtQuantity(targetQty);
  };

  return {
    updateQuantity,
    isUpdatingQuantity: isAddingToCart || isRemovingFromCart,
    isReadOnly,
  };
}
