import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI, isBundleLineItem } from 'utils/index';
import { QUERY_KEYS } from 'constants/queryKeys';
import { Cart, CartLineItem, MutationCallbacks, UpdateCartResponse } from 'types/index';

const MUTATION_KEY = 'B2B_CHANGE_LINE_ITEM_QUANTITY';

type ChangeLineItemQuantityProps = {
  lineItem: CartLineItem;
  quantity: number;
};

const getActions = ({ lineItem, quantity }: ChangeLineItemQuantityProps) => {
  const target = isBundleLineItem(lineItem) ? lineItem.products[0] : lineItem;

  return [
    {
      changeLineItemQuantity: {
        lineItemId: target.id,
        quantity,
      },
    },
  ];
};

export default function useChangeLineItemQuantity(callbacks?: MutationCallbacks<Cart>) {
  const { cartId, setCartId, userCountry } = useUserSession();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationKey: [MUTATION_KEY],
    mutationFn: async (payload: ChangeLineItemQuantityProps) => {
      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId,
          country: userCountry,
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
    onError: callbacks?.onError,
  });

  return {
    changeLineItemQuantity: mutate,
    changeLineItemQuantityAsync: mutateAsync,
    isChangingLineItemQuantity: isPending,
    changeLineItemQuantityError: error,
    changeLineItemQuantitySuccess: isSuccess,
  };
}
