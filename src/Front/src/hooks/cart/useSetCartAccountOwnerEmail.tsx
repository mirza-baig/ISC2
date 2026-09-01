import { useMutation } from '@tanstack/react-query';

import { useCart } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { MutationCallbacks, UpdateCartResponse } from 'types/index';

/** Custom field name on the commercetools cart. Must match what Mule reads. */
export const ACCOUNT_OWNER_EMAIL_FIELD = 'accountOwnerEmail';

type SetCartAccountOwnerEmailProps = {
  accountOwnerEmail?: string;
};
export default function useSetCartAccountOwnerEmail(callbacks?: MutationCallbacks) {
  const { activeCart } = useCart();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ accountOwnerEmail }: SetCartAccountOwnerEmailProps) => {
      const email = accountOwnerEmail?.trim();

      // TEMP debug
      console.log('[ACCOUNT-OWNER-EMAIL-DEBUG] step one', {
        cartId: activeCart?.id,
        accountOwnerEmail: email,
        willSend: Boolean(email && activeCart?.id),
      });

      // Salesforce accounts can have no owner. Mule skips the BCC when the field is absent,
      // so a missing address is a no-op rather than an empty custom field on the cart.
      if (!email || !activeCart?.id) {
        return;
      }

      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId: activeCart.id,
          actions: [
            {
              setCustomField: {
                name: ACCOUNT_OWNER_EMAIL_FIELD,
                value: email,
              },
            },
          ],
        },
      });

      if ((data.errors || []).length) {
        throw data.errors;
      }

      return data.data.isc2CartUpdate;
    },
    onSuccess: () => {
      if (callbacks?.onSuccess) {
        callbacks?.onSuccess();
      }
    },
    onError: callbacks?.onError,
  });

  return {
    setCartAccountOwnerEmail: mutate,
    setCartAccountOwnerEmailAsync: mutateAsync,
    isSettingCartAccountOwnerEmail: isPending,
    setCartAccountOwnerEmailError: error,
  };
}
