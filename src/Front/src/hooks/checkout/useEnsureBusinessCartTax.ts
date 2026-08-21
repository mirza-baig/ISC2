import { useCallback, useState } from 'react';

import { useCart, useCheckoutProcess } from 'providers/index';
import { isTaxAddressDefined } from 'utils/index';
import { PersonalInformation } from 'types/index';

import useIsBusinessBuyer from '../cart/useIsBusinessBuyer';
import useSetCartAddress from '../cart/useSetCartAddress';
import useUpdateTax from '../cart/useUpdateTax';
import useGetPaymentIntent from './useGetPaymentIntent';

/**
 * B2B prepaid/credit eligibility must use cart + tax. Recalculate is a no-op on
 * B2B carts, so this sets the shipping address and calls tax directly.
 */
export default function useEnsureBusinessCartTax() {
  const isBusinessBuyer = useIsBusinessBuyer();
  const { activeCart } = useCart();
  const { setErrorState } = useCheckoutProcess();
  const { setCartAddressAsync } = useSetCartAddress({ onError: setErrorState });
  const { setTaxesAsync } = useUpdateTax();
  const { getPaymentIntentAsync } = useGetPaymentIntent();
  const [isEnsuringTax, setIsEnsuringTax] = useState(false);

  const hasTaxedTotal = Boolean(activeCart?.taxedPrice);

  const ensureTaxedCart = useCallback(
    async (personalInformation?: PersonalInformation) => {
      if (!isBusinessBuyer) {
        return activeCart;
      }

      setIsEnsuringTax(true);

      try {
        let cart = activeCart;

        if (personalInformation) {
          const updated = await setCartAddressAsync({ personalInformation });
          cart = updated || cart;
        }

        if (!cart?.id || !isTaxAddressDefined(cart.shippingAddress)) {
          return cart;
        }

        try {
          const taxedCart = await setTaxesAsync({ cartId: cart.id });
          const cartForPaymentIntent = taxedCart || cart;

          if (!cartForPaymentIntent) {
            return cart;
          }

          const paymentIntent = await getPaymentIntentAsync({ cart: cartForPaymentIntent });

          if (!paymentIntent?.intentPaymentId) {
            return cartForPaymentIntent;
          }

          const syncedCart = await setTaxesAsync({
            cartId: cartForPaymentIntent.id,
            paymentIntentId: paymentIntent.intentPaymentId,
          });

          return syncedCart || cartForPaymentIntent;
        } catch {
          return cart;
        }
      } finally {
        setIsEnsuringTax(false);
      }
    },
    [activeCart, getPaymentIntentAsync, isBusinessBuyer, setCartAddressAsync, setTaxesAsync]
  );

  return { ensureTaxedCart, hasTaxedTotal, isEnsuringTax };
}
