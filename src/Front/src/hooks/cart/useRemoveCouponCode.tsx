import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { UpdateCartResponse } from 'types/index';

type RemoveCouponCodeProps = {
  discountCodeId: string;
};

export default function useRemoveCouponCode() {
  const queryClient = useQueryClient();
  const { cartId, setCartId } = useUserSession();

  const { mutate, isPending, error, isSuccess, data } = useMutation({
    mutationFn: async ({ discountCodeId }: RemoveCouponCodeProps) => {
      const api = await getServiceLayerAPI();

      if (!cartId) {
        throw new Error('No active cart found');
      }

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId,
          actions: [
            {
              removeDiscountCode: {
                discountCode: {
                  typeId: 'discount-code',
                  id: discountCodeId,
                },
              },
            },
          ],
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

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart.id], updatedCart);
    },
  });

  return {
    removeCouponCode: mutate,
    isRemovingCouponCode: isPending,
    couponCodeError: error,
    removedCouponSuccess: isSuccess,
    removeCouponData: data,
  };
}
