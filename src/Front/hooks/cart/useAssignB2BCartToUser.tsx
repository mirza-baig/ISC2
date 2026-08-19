import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { Cart, MutationCallbacks } from 'types/index';
import useLoggedUser from 'hooks/useLoggedUser';

type MutationPayload = {
  cartID: string;
};

export default function useAssignB2BCartToUser(callbacks?: MutationCallbacks) {
  const { externalID, email } = useLoggedUser();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation<Cart, Error, MutationPayload>({
    mutationFn: async ({ cartID }: MutationPayload) => {
      const api = await getServiceLayerAPI();

      const { data } = await api.post('', {
        query: 'GET_ACTIVE_CART',
        variables: {
          cartInfo: { cartID, userEmailAddress: email, userExternalId: externalID },
        },
      });

      const { isc2GetCart: cart } = data.data;

      return cart;
    },
    onSuccess: (cart) => {
      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, cart.id], cart);

      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }
    },
  });

  return {
    assignB2BCartError: error,
    assignB2BCartToUser: mutate,
    isAssigningCart: isPending,
  };
}
