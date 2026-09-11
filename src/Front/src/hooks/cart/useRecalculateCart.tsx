import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useCart, useUserSession } from 'providers/index';
import { QUERY_KEYS } from 'constants/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import postCartUpdate from './postCartUpdate';

type RecalculateCartPayload = {
  cartId?: string;
};

export default function useRecalculateCart() {
  const queryClient = useQueryClient();
  const { setCartId, userCountry } = useUserSession();
  const { activeCart } = useCart();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async (payload?: RecalculateCartPayload) => {
      if (activeCart.computed.isB2B) {
        return;
      }

      const cartIdForRecalculation = payload?.cartId || activeCart.id;

      if (!cartIdForRecalculation) {
        throw 'User does not have a CartID set';
      }

      return postCartUpdate(
        {
          cartId: cartIdForRecalculation,
          country: userCountry,
          actions: [{ recalculate: {} }],
          authorizedBuyerPricingVoucher,
        },
        (errors) => {
          throw errors;
        }
      );
    },
    onSuccess: (updatedCart) => {
      if (!updatedCart || activeCart.computed.isB2B) {
        return;
      }

      if (activeCart.id !== updatedCart.id) {
        setCartId(updatedCart.id);
      }

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart?.id], updatedCart);
    },
  });

  const recalculateCart = useCallback(
    (payload?: RecalculateCartPayload) => mutate(payload),
    [mutate]
  );

  const recalculateCartAsync = useCallback(
    (payload?: RecalculateCartPayload) => mutateAsync(payload),
    [mutateAsync]
  );

  return {
    recalculateCart,
    recalculateCartAsync,
    isRecalculating: isPending,
    recalculateCartError: error,
    recalculateCartSuccess: isSuccess,
  };
}
