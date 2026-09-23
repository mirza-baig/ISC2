import { useMutation } from '@tanstack/react-query';

import { useCart } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { MutationCallbacks, UpdateCartResponse } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import useIsBusinessBuyer from './useIsBusinessBuyer';

export type B2BCartCustomFieldsInput = {
  poNumber?: string;
  customerOrderReference?: string;
  organization?: string;
  buyer?: string;
};

const CUSTOM_TYPE_KEY = 'ISCCartOrderModelCustomization';

const buildFields = (input: B2BCartCustomFieldsInput) =>
  (
    [
      ['poNumber', input.poNumber],
      ['customerOrderReference', input.customerOrderReference],
      ['organization', input.organization],
      ['buyer', input.buyer],
    ] as const
  )
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([name, value]) => ({ name, value: String(value) }));

export default function useSetCartCustomFields(callbacks?: MutationCallbacks) {
  const { activeCart } = useCart();
  const isBusinessBuyer = useIsBusinessBuyer();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (input: B2BCartCustomFieldsInput) => {
      // Hard guard: this hook must not write custom fields for non-B2B carts.
      if (!isBusinessBuyer) {
        return;
      }

      if (!activeCart?.id) {
        return;
      }

      const fields = buildFields(input);

      if (!fields.length) {
        return;
      }

      const api = await getServiceLayerAPI();
      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId: activeCart.id,
          actions: [
            {
              setCustomType: {
                type: { key: CUSTOM_TYPE_KEY },
                fields,
              },
            },
          ],
          authorizedBuyerPricingVoucher,
        },
      });

      const updatedCart = data.data?.isc2CartUpdate;
      const persistedFields = updatedCart?.custom?.customFieldsRaw ?? [];
      const writeLanded =
        !!updatedCart &&
        fields.every((target) => persistedFields.some((f) => f.name === target.name));

      if (!writeLanded) {
        const errors = data.errors ?? [];
        if (errors.length) {
          throw errors;
        }
        throw new Error('Cart custom fields did not persist on the returned cart');
      }

      return updatedCart;
    },
    onSuccess: () => {
      callbacks?.onSuccess?.();
    },
    onError: callbacks?.onError,
  });

  return {
    setCartCustomFields: mutate,
    setCartCustomFieldsAsync: mutateAsync,
    isSettingCartCustomFields: isPending,
    setCartCustomFieldsError: error,
  };
}
