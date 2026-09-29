import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { Cart, ServiceLayerError, UpdateCartResponse } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';

/** commercetools relative discounts are in permyriad: 20% → 2000. */
export const toPermyriad = (discountPercentage: number) => Math.round(discountPercentage * 100);

export const buildDirectDiscountActions = (discountPercentage: number | null) => [
  {
    setDirectDiscounts: {
      discounts:
        discountPercentage && discountPercentage > 0
          ? [
              {
                value: {
                  relative: {
                    permyriad: toPermyriad(discountPercentage),
                  },
                },
                target: {
                  lineItems: {
                    predicate: 'quantity > 0',
                  },
                },
              },
            ]
          : [],
    },
  },
];

/**
 * Which cart carries the prepaid discount. Tracked here rather than read off the cart: a
 * direct discount looks the same whoever set it, so this keeps the clean-up (and every
 * display that depends on it) to the prepaid discount alone. localStorage, so a reload
 * mid-checkout still knows to clear it.
 */
const PREPAID_DISCOUNT_CART_KEY = 'isc2-prepaid-discount-cart-id';

const rememberPrepaidDiscount = (cartId: string, hasDiscount: boolean) => {
  try {
    if (hasDiscount) {
      localStorage.setItem(PREPAID_DISCOUNT_CART_KEY, cartId);
    } else if (localStorage.getItem(PREPAID_DISCOUNT_CART_KEY) === cartId) {
      localStorage.removeItem(PREPAID_DISCOUNT_CART_KEY);
    }
  } catch {
    // No storage (SSR, private mode): the discount is then only cleared from checkout.
  }
};

/** True when this cart has the prepaid discount on it. */
export const hasPrepaidDiscount = (cart?: { id?: string }) => {
  if (!cart?.id) {
    return false;
  }

  try {
    return localStorage.getItem(PREPAID_DISCOUNT_CART_KEY) === cart.id;
  } catch {
    return false;
  }
};

/**
 * Appended to other cart updates (e.g. add to cart) so a prepaid discount left behind is
 * cleared. Empty for every cart that does not carry it, so other discounts are untouched.
 */
export const clearPrepaidDiscountActions = (cartId?: string) =>
  hasPrepaidDiscount({ id: cartId }) ? buildDirectDiscountActions(null) : [];

/** Call once an update carrying `clearPrepaidDiscountActions` has succeeded. */
export const forgetPrepaidDiscount = (cartId?: string) => {
  if (cartId) {
    rememberPrepaidDiscount(cartId, false);
  }
};

let discountSyncsInFlight = 0;

export const isDiscountSyncInFlight = () => discountSyncsInFlight > 0;

export const trackDiscountSync = async <T,>(run: () => Promise<T>): Promise<T> => {
  discountSyncsInFlight += 1;

  try {
    return await run();
  } finally {
    discountSyncsInFlight -= 1;
  }
};

type SetDiscountPercentageProps = {
  discountPercentage: number | null;
};

export default function useDiscountPercentage() {
  const queryClient = useQueryClient();
  const { cartId, setCartId } = useUserSession();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async ({ discountPercentage }: SetDiscountPercentageProps) => {
      if (!cartId) {
        throw new Error('There is no active cart to apply the discount percentage to');
      }

      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId,
          actions: buildDirectDiscountActions(discountPercentage),
          authorizedBuyerPricingVoucher,
        },
      });

      if ((data.errors || []).length) {
        throw data.errors[0];
      }

      rememberPrepaidDiscount(cartId, Boolean(discountPercentage && discountPercentage > 0));

      return data.data.isc2CartUpdate;
    },
  });

  const storeCart = useCallback(
    (updatedCart: Cart) => {
      if (updatedCart.id !== cartId) {
        setCartId(updatedCart.id);
      }

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart.id], updatedCart);
    },
    [cartId, queryClient, setCartId]
  );

  const applyDiscountPercentageAsync = useCallback(
    (discountPercentage: number) => mutateAsync({ discountPercentage }),
    [mutateAsync]
  );

  const removeDiscountPercentageAsync = useCallback(
    () => mutateAsync({ discountPercentage: null }),
    [mutateAsync]
  );

  return {
    applyDiscountPercentageAsync,
    removeDiscountPercentageAsync,
    storeCart,
    isUpdatingDiscountPercentage: isPending,
    discountPercentageError: error as ServiceLayerError,
    updatedDiscountPercentageSuccess: isSuccess,
  };
}
