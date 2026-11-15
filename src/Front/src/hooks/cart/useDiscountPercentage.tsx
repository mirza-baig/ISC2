import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { BUSINESS_PAYMENT_METHODS } from 'constants/checkout';
import { B2B_FEATURE_FLAG } from 'constants/b2b';
import { Cart, ServiceLayerError, UpdateCartResponse } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';

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

export const clearPaymentTypeSelection = (cartId?: string) =>
  hasPrepaidDiscount({ id: cartId }) ? { paymentType: '' } : {};

export const buildPaymentTypeVariables = (
  isB2BFeatureEnabled: boolean,
  discountPercentage: number | null,
  paymentType = ''
) =>
  isB2BFeatureEnabled
    ? { actions: [{ recalculate: {} }], paymentType }
    : { actions: buildDirectDiscountActions(discountPercentage) };

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
  paymentType?: string;
};

export default function useDiscountPercentage() {
  const queryClient = useQueryClient();
  const { cartId, setCartId } = useUserSession();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);

  const { mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async ({ discountPercentage, paymentType }: SetDiscountPercentageProps) => {
      if (!cartId) {
        throw new Error('There is no active cart to apply the discount percentage to');
      }

      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId,
          ...buildPaymentTypeVariables(isB2BFeatureEnabled, discountPercentage, paymentType),
          authorizedBuyerPricingVoucher,
        },
      });

      if ((data.errors || []).length) {
        throw data.errors[0];
      }

      rememberPrepaidDiscount(
        cartId,
        isB2BFeatureEnabled
          ? paymentType === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT
          : Boolean(discountPercentage && discountPercentage > 0)
      );

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
    (discountPercentage: number) =>
      mutateAsync({ discountPercentage, paymentType: BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT }),
    [mutateAsync]
  );

  const removeDiscountPercentageAsync = useCallback(
    () => mutateAsync({ discountPercentage: null }),
    [mutateAsync]
  );

  const setPaymentTypeAsync = useCallback(
    (paymentType: string) => mutateAsync({ discountPercentage: null, paymentType }),
    [mutateAsync]
  );

  return {
    applyDiscountPercentageAsync,
    removeDiscountPercentageAsync,
    setPaymentTypeAsync,
    storeCart,
    isUpdatingDiscountPercentage: isPending,
    discountPercentageError: error as ServiceLayerError,
    updatedDiscountPercentageSuccess: isSuccess,
  };
}
