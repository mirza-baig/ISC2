import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI, isBundleLineItem } from 'utils/index';
import { QUERY_KEYS } from 'constants/queryKeys';
import { Cart, CartLineItem, MutationCallbacks, UpdateCartResponse } from 'types/index';

type RemoveFromCartProps = {
  lineItems: CartLineItem[];
};

const getActions = (payload: RemoveFromCartProps) =>
  payload.lineItems.map((lineItem) => {
    const lineItemToDelete = isBundleLineItem(lineItem) ? lineItem.products[0] : lineItem;

    return {
      removeLineItem: {
        lineItemId: lineItemToDelete.id,
      },
    };
  });

export default function useRemoveFromCart(callbacks?: MutationCallbacks<Cart>) {
  const { cartId, setCartId } = useUserSession();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationKey: [QUERY_KEYS.REMOVE_FROM_CART],
    mutationFn: async (payload: RemoveFromCartProps) => {
      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId,
          actions: getActions(payload),
        },
      });

      if ((data.errors || []).length) {
        throw data.errors[0].message;
      }

      return data.data.isc2CartUpdate;
    },
    onSuccess: (updatedCart) => {
      if (updatedCart.id !== cartId) {
        setCartId(updatedCart.id);
      }

      if (callbacks?.onSuccess) {
        callbacks.onSuccess(updatedCart);
      }

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart.id], updatedCart);
    },
  });

  return {
    removeFromCart: mutate,
    removeFromCartAsync: mutateAsync,
    isRemovingFromCart: isPending,
    removeFromCartSuccess: isSuccess,
    removeFromCartError: error,
  };
}
