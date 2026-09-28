import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { Cart, ServiceLayerError, UpdateCartResponse } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';

export const isDiscountPercentageEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_ENABLE_DISCOUNT_PERCENTAGE === 'true';

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
 * The prepaid discount belongs on the cart only while prepaid is selected at checkout.
 * Appended to other cart updates (e.g. add to cart) so one left behind is cleared.
 */
export const clearDirectDiscountActions = () =>
  isDiscountPercentageEnabled() ? buildDirectDiscountActions(null) : [];

/**
 * Direct discounts have no discount record, so their line item `includedDiscounts`
 * entries come back with `discount: null`; cart discounts always reference one.
 */
type DirectDiscountLineItem = {
  discountedPricePerQuantity?: {
    discountedPrice?: { includedDiscounts?: { discount?: unknown }[] };
  }[];
};

export const hasDirectDiscount = (cart?: { lineItems?: unknown }) =>
  Boolean(
    ((cart?.lineItems || []) as DirectDiscountLineItem[]).some((lineItem) =>
      (lineItem.discountedPricePerQuantity || []).some(({ discountedPrice }) =>
        (discountedPrice?.includedDiscounts || []).some(({ discount }) => !discount)
      )
    )
  );

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
    isDiscountPercentageEnabled: isDiscountPercentageEnabled(),
    applyDiscountPercentageAsync,
    removeDiscountPercentageAsync,
    storeCart,
    isUpdatingDiscountPercentage: isPending,
    discountPercentageError: error as ServiceLayerError,
    updatedDiscountPercentageSuccess: isSuccess,
  };
}
