import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { QUERY_KEYS } from 'constants/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import postCartUpdate from './postCartUpdate';

type RemoveCouponCodeProps = {
  discountCodeId: string;
};

export default function useRemoveCouponCode() {
  const queryClient = useQueryClient();
  const { cartId, setCartId } = useUserSession();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutate, isPending, error, isSuccess, data } = useMutation({
    mutationFn: async ({ discountCodeId }: RemoveCouponCodeProps) => {
      if (!cartId) {
        throw new Error('No active cart found');
      }

      return postCartUpdate(
        {
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
          authorizedBuyerPricingVoucher,
        },
        (errors) => {
          throw errors[0].message;
        }
      );
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
