import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { Cart, ServiceLayerError, UpdateCartResponse } from 'types/index';

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

const PREPAID_DISCOUNT_CART_KEY = 'isc2-prepaid-discount-cart-id';

const rememberPrepaidDiscount = (cartId: string, hasDiscount: boolean) => {
  try {
    if (hasDiscount) {
      localStorage.setItem(PREPAID_DISCOUNT_CART_KEY, cartId);
    } else if (localStorage.getItem(PREPAID_DISCOUNT_CART_KEY) === cartId) {
      localStorage.removeItem(PREPAID_DISCOUNT_CART_KEY);
    }
  } catch {}
};

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

export const clearPrepaidDiscountActions = (cartId?: string) =>
  hasPrepaidDiscount({ id: cartId }) ? buildDirectDiscountActions(null) : [];

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
