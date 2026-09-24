import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { ServiceLayerError, UpdateCartResponse } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';

export const isDiscountPercentageEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_ENABLE_DISCOUNT_PERCENTAGE === 'true';

type ApplyDiscountPercentageProps = {
  discountPercentage: number;
};

export default function useDiscountPercentage() {
  const queryClient = useQueryClient();
  const { cartId, setCartId } = useUserSession();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async ({ discountPercentage }: ApplyDiscountPercentageProps) => {
      if (!cartId) {
        throw new Error('There is no active cart to apply the discount percentage to');
      }

      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId,
          actions: [
            {
              discountPercentage: {
                value: discountPercentage,
              },
            },
          ],
          authorizedBuyerPricingVoucher,
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
    isDiscountPercentageEnabled: isDiscountPercentageEnabled(),
    applyDiscountPercentage: mutate,
    applyDiscountPercentageAsync: mutateAsync,
    isApplyingDiscountPercentage: isPending,
    discountPercentageError: error as ServiceLayerError,
    appliedDiscountPercentageSuccess: isSuccess,
  };
}
