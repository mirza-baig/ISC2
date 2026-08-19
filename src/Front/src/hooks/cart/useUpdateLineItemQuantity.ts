import { useCart } from 'providers/index';
import { getPickedProductFromBundleLine, isBundleLineItem } from 'utils/index';
import useAddToCart from './useAddToCart';
import useChangeLineItemQuantity from './useChangeLineItemQuantity';
import useRemoveFromCart from './useRemoveFromCart';
import type { AddToCartHit, CartLineItem, ProductHit as AddToCartProductHit } from 'types/index';

/**
 * B2B "set line-item quantity" (QTY-4 interim). A self-serve cart has no set-quantity path of its
 * own — the service layer's `changeLineItemQuantity` action skips the bundle and channel transforms
 * an add goes through — so a self-serve line's quantity is set with the existing add/remove
 * mechanisms:
 *   - increase → add the delta (single mutation, reuses the working add path)
 *   - decrease → remove the line, then re-add at the target quantity
 *   - zero     → remove the line
 *
 * Because the B2B PLP row AND the on-page cart both read a line's quantity from the same
 * active cart, writing here makes both views reflect the change automatically (no local
 * state to keep in sync).
 *
 * CPQ carts are read-only unless the caller opts in with `allowCpqCart` (CTX-5, narrowed
 * 2026-08-17): the cart page and the mini cart let an **Authorized Buyer** change a quoted line's
 * quantity, and nothing else does — the PLP surfaces and `useCartPreload` pass no options and keep
 * refusing outright. A quote takes the single-action path below rather than the add/remove pair,
 * and the write still has to be allowed by the service layer (CT-CART-7).
 * B2B-only (the PLP is gated).
 */
export type UpdateLineItemQuantityOptions = {
  allowCpqCart?: boolean;
};

export default function useUpdateLineItemQuantity({
  allowCpqCart = false,
}: UpdateLineItemQuantityOptions = {}) {
  const { activeCart } = useCart();
  const { addToCartAsync, isAddingToCart } = useAddToCart();
  const { removeFromCartAsync, isRemovingFromCart } = useRemoveFromCart();
  const { changeLineItemQuantityAsync, isChangingLineItemQuantity } = useChangeLineItemQuantity();

  const isCpqCart = Boolean(activeCart?.computed?.isB2B);
  const isReadOnly = isCpqCart && !allowCpqCart;

  const updateQuantity = async (lineItem: CartLineItem, targetQty: number): Promise<void> => {
    if (isReadOnly) {
      return;
    }
    const current = lineItem.quantity;
    if (targetQty === current) {
      return;
    }

    if (isCpqCart) {
      await changeLineItemQuantityAsync({ lineItem, quantity: targetQty });
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
    isUpdatingQuantity: isAddingToCart || isRemovingFromCart || isChangingLineItemQuantity,
    isReadOnly,
  };
}
