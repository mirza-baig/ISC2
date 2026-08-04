import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { ServiceLayerError, UpdateCartResponse } from 'types/index';

import useCreateCart from './useCreateCart';

type ApplyCouponCodeProps = {
  discountCode: string;
};

export default function useApplyCouponCode() {
  const queryClient = useQueryClient();
  const { cartId, setCartId } = useUserSession();
  const { createCartAsync } = useCreateCart();

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: async ({ discountCode }: ApplyCouponCodeProps) => {
      const api = await getServiceLayerAPI();

      let userCartId = cartId;

      if (!cartId) {
        userCartId = await createCartAsync();

        if (!userCartId) {
          throw new Error('There was an error when creating a cart for the user');
        }
      }

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId: userCartId,
          actions: [
            {
              addDiscountCode: {
                code: discountCode,
              },
            },
          ],
        },
      });

      if ((data.errors || []).length) {
        throw data.errors[0];
      }

      return data.data.isc2CartUpdate;
    },
    onSuccess: (updatedCart) => {
      if (updatedCart.id !== cartId) {
        setCartId(updatedCart.id);
      }

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart.id], updatedCart);
    },
  });

  return {
    applyCouponCode: mutate,
    isApplyingCouponCode: isPending,
    couponCodeError: error as ServiceLayerError,
    appliedCouponSuccess: isSuccess,
  };
}
