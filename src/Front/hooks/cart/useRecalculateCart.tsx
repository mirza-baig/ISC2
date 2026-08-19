import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useCart, useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { UpdateCartResponse } from 'types/index';

type RecalculateCartPayload = {
  cartId?: string;
};

export default function useRecalculateCart() {
  const queryClient = useQueryClient();
  const { setCartId, userCountry } = useUserSession();
  const { activeCart } = useCart();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async (payload?: RecalculateCartPayload) => {
      if (activeCart.computed.isB2B) {
        return;
      }

      const cartIdForRecalculation = payload?.cartId || activeCart.id;

      if (!cartIdForRecalculation) {
        throw 'User does not have a CartID set';
      }

      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId: cartIdForRecalculation,
          country: userCountry,
          actions: [{ recalculate: {} }],
        },
      });

      if ((data.errors || []).length) {
        throw data.errors;
      }

      return data.data.isc2CartUpdate;
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
