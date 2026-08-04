import { useMutation } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { LOCALSTORAGE_KEYS } from 'constants/index';
import { getServiceLayerAPI } from 'utils/index';

export default function useCreateCart() {
  const { currencyCode, userCountry, setCartId } = useUserSession();

  const { mutate, mutateAsync, isPending, error } = useMutation<string>({
    mutationFn: async () => {
      const api = await getServiceLayerAPI();

      const { data } = await api.post('', {
        query: 'CREATE_CART',
        variables: {
          createCartDraft: {
            country: userCountry,
            currency: currencyCode,
            anonymousId: localStorage.getItem(LOCALSTORAGE_KEYS.ANONYMOUS_ID) ?? '',
            taxMode: 'ExternalAmount',
            customerGroup: {
              key: 'cg-non-members',
              typeId: 'customer-group',
            },
          },
        },
      });

      return data.data.createCart.id;
    },
    onSuccess: setCartId,
    onError: (err) => {
      console.error('ERROR DURING create cart REQUEST:', err);
    },
  });

  return {
    createCart: mutate,
    createCartAsync: mutateAsync,
    isCreatingCart: isPending,
    createCartError: error,
  };
}
