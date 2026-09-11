import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { B2B_FEATURE_FLAG } from 'constants/b2b';
import { QUERY_KEYS } from 'constants/index';
import {
  buildZeroTaxCartActions,
  isBusinessTaxExempt,
  withZeroTaxedPrice,
} from 'lib/authorizedBuyer';
import { useCart, useCheckoutProcess, useModal, useUserSession } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { getServiceLayerAPI, isTaxAddressDefined } from 'utils/index';
import { Cart, CartWithComputedData, PersonalInformation, UpdateCartResponse } from 'types/index';

import useIsBusinessBuyer from '../cart/useIsBusinessBuyer';
import useSetCartAddress from '../cart/useSetCartAddress';
import useUpdateTax from '../cart/useUpdateTax';
import useActiveBusinessAccount from '../user/useActiveBusinessAccount';
import useGetPaymentIntent from './useGetPaymentIntent';

type EnsureBusinessCartTaxOptions = {
  paymentMethodType?: string;
  cart?: Cart | CartWithComputedData;
  throwOnError?: boolean;
  preservePaymentIntent?: boolean;
};

export default function useEnsureBusinessCartTax() {
  const queryClient = useQueryClient();
  const { cartId } = useUserSession();
  const { closeModal } = useModal();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const isBusinessBuyer = useIsBusinessBuyer();
  const { activeCart } = useCart();
  const { taxExempt } = useActiveBusinessAccount();
  const { setErrorState } = useCheckoutProcess();
  const { setCartAddressAsync } = useSetCartAddress({ onError: setErrorState });
  const { setTaxesAsync } = useUpdateTax();
  const { getPaymentIntentAsync, paymentIntent } = useGetPaymentIntent();
  const [isEnsuringTax, setIsEnsuringTax] = useState(false);
  const inFlightRef = useRef<Promise<Cart | CartWithComputedData | undefined> | null>(null);
  const isLockedRef = useRef(false);

  const hasTaxedTotal = Boolean(activeCart?.taxedPrice);
  const isTaxExempt = isBusinessTaxExempt(isB2BFeatureEnabled, taxExempt);

  const clearTaxError = useCallback(() => {
    queryClient.setQueryData(['CustomMutationError', [QUERY_KEYS.TAXES, cartId]], null);
    closeModal();
  }, [cartId, closeModal, queryClient]);

  const applyExemptTax = useCallback(
    async (cart: Cart | CartWithComputedData) => {
      if (!cart?.id) {
        return cart;
      }

      const cachedCart = queryClient.getQueryData<Cart>([QUERY_KEYS.ACTIVE_CART, cart.id]);
      const actions = buildZeroTaxCartActions(cart);

      const storeExemptCart = (nextCart: Cart | CartWithComputedData) => {
        queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, nextCart.id], nextCart);
        return nextCart;
      };

      if (!actions.length) {
        return storeExemptCart(withZeroTaxedPrice(cachedCart || cart));
      }

      try {
        const api = await getServiceLayerAPI();
        const { data } = await api.post<UpdateCartResponse>('', {
          query: 'UPDATE_CART',
          variables: {
            cartId: cart.id,
            actions,
          },
        });

        if ((data.errors || []).length || !data.data.isc2CartUpdate) {
          return storeExemptCart(withZeroTaxedPrice(cachedCart || cart));
        }

        const updatedCart = data.data.isc2CartUpdate;

        if (!updatedCart.taxedPrice) {
          return storeExemptCart(withZeroTaxedPrice(updatedCart));
        }

        return storeExemptCart(updatedCart);
      } catch {
        return storeExemptCart(withZeroTaxedPrice(cachedCart || cart));
      }
    },
    [queryClient]
  );

  const ensureTaxedCart = useCallback(
    async (personalInformation?: PersonalInformation, options?: EnsureBusinessCartTaxOptions) => {
      if (!isB2BFeatureEnabled || !isBusinessBuyer) {
        return options?.cart || activeCart;
      }

      if (isLockedRef.current && inFlightRef.current) {
        return inFlightRef.current;
      }

      isLockedRef.current = true;

      const run = (async () => {
        setIsEnsuringTax(true);
        clearTaxError();

        try {
          let cart: Cart | CartWithComputedData | undefined = options?.cart || activeCart;

          if (personalInformation) {
            const updated = await setCartAddressAsync({ personalInformation });
            if (updated) {
              cart = { ...cart, ...updated };
            }
          }

          if (!cart?.id || !isTaxAddressDefined(cart.shippingAddress)) {
            return cart;
          }

          if (isTaxExempt) {
            const exemptCart = await applyExemptTax(cart);

            if (exemptCart && !options?.preservePaymentIntent) {
              await getPaymentIntentAsync({
                cart: exemptCart,
                paymentMethodType: options?.paymentMethodType,
              });
            }

            clearTaxError();
            return exemptCart || cart;
          }

          try {
            if (options?.preservePaymentIntent) {
              const existingPaymentIntentId = paymentIntent?.intentPaymentId ?? null;
              const syncedCart = await setTaxesAsync({
                cartId: cart.id,
                paymentIntentId: existingPaymentIntentId,
              });

              clearTaxError();
              return syncedCart || cart;
            }

            const taxedCart = await setTaxesAsync({
              cartId: cart.id,
              paymentIntentId: null,
            });
            const cartForPaymentIntent = taxedCart || cart;

            if (!cartForPaymentIntent) {
              return cart;
            }

            const nextPaymentIntent = await getPaymentIntentAsync({
              cart: cartForPaymentIntent,
              paymentMethodType: options?.paymentMethodType,
            });

            if (!nextPaymentIntent?.intentPaymentId) {
              return cartForPaymentIntent;
            }

            try {
              const syncedCart = await setTaxesAsync({
                cartId: cartForPaymentIntent.id,
                paymentIntentId: nextPaymentIntent.intentPaymentId,
              });

              clearTaxError();
              return syncedCart || cartForPaymentIntent;
            } catch {
              clearTaxError();
              return cartForPaymentIntent;
            }
          } catch (error) {
            if (options?.throwOnError) {
              throw error;
            }

            clearTaxError();
            return cart;
          }
        } finally {
          setIsEnsuringTax(false);
          isLockedRef.current = false;
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = run;
      return run;
    },
    [
      activeCart,
      applyExemptTax,
      clearTaxError,
      getPaymentIntentAsync,
      isB2BFeatureEnabled,
      isBusinessBuyer,
      isTaxExempt,
      paymentIntent?.intentPaymentId,
      setCartAddressAsync,
      setTaxesAsync,
    ]
  );

  return { ensureTaxedCart, hasTaxedTotal, isEnsuringTax, isTaxExempt };
}
