import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { isBundleLineItem } from 'utils/index';
import { QUERY_KEYS } from 'constants/queryKeys';
import { Cart, CartLineItem, MutationCallbacks } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import postCartUpdate from './postCartUpdate';

type RemoveFromCartProps = {
  lineItems: CartLineItem[];
  cartId?: string;
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
  const { cartId: sessionCartId, setCartId } = useUserSession();
  const queryClient = useQueryClient();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationKey: [QUERY_KEYS.REMOVE_FROM_CART],
    mutationFn: async (payload: RemoveFromCartProps) => {
      const targetCartId = payload.cartId || sessionCartId;

      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ACTIVE_CART, targetCartId] });

      return postCartUpdate(
        {
          cartId: targetCartId,
          actions: getActions(payload),
          authorizedBuyerPricingVoucher,
        },
        (errors) => {
          throw errors[0].message;
        }
      );
    },
    onSuccess: (updatedCart, variables) => {
      if (!variables.cartId && updatedCart.id !== sessionCartId) {
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
