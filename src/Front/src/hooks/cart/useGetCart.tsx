import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { QUERY_KEYS } from 'constants/index';
import { Cart, CartWithComputedData } from 'types/index';
import {
  getServiceLayerAPI,
  addComputedFieldsToLineItems,
  CurrencyCodes,
  getComputedFieldsFromCart,
  removeBundleDiscountCodes,
} from 'utils/index';
import useLoggedUser from 'hooks/useLoggedUser';
import { useUserSession } from 'providers/index';

type GetCartPayload = {
  enabled: boolean;
  includeUserEmail?: boolean;
  cartID?: string;
  currency?: CurrencyCodes;
  country?: string;
  onSuccess?: (cart: Cart) => void;
};

const formatPayload = ({
  payload,
  userEmailAddress,
  externalID,
  country,
}: {
  payload: Omit<GetCartPayload, 'enabled'>;
  userEmailAddress?: string;
  externalID?: string;
  country?: string;
}) => {
  const { includeUserEmail, ...cartPayload } = payload;

  if (includeUserEmail && userEmailAddress && externalID) {
    return { ...cartPayload, userEmailAddress, userExternalId: externalID, country };
  }

  return cartPayload;
};

export default function useGetCart({ enabled, onSuccess, ...payload }: GetCartPayload) {
  const { externalID, email, isGettingUser } = useLoggedUser();
  const { userCountry } = useUserSession();

  const { data, isLoading, error, refetch, isSuccess } = useQuery<Cart>({
    queryKey: [QUERY_KEYS.ACTIVE_CART, payload.cartID],
    queryFn: async () => {
      const api = await getServiceLayerAPI();

      const { data } = await api.post('', {
        query: 'GET_ACTIVE_CART',
        variables: {
          cartInfo: formatPayload({
            payload,
            userEmailAddress: email,
            externalID,
            country: userCountry,
          }),
        },
      });

      if ((data.errors || []).length) {
        throw data.errors[0];
      }

      const { isc2GetCart: cart } = data.data;

      if (onSuccess) {
        onSuccess(cart);
      }

      return cart;
    },
    enabled: enabled && !isGettingUser,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const cart = useMemo(() => {
    if (data) {
      const newCart = removeBundleDiscountCodes(data);

      return addComputedFieldsToLineItems(newCart);
    }

    return null;
  }, [data]);

  const computed = useMemo(() => getComputedFieldsFromCart(cart, isSuccess), [cart, isSuccess]);

  return {
    activeCart: {
      ...cart,
      computed,
    } as CartWithComputedData,
    getCartSuccess: isSuccess,
    activeCartData: cart,
    cartError: error,
    getActiveCart: refetch,
    isGettingCart: isLoading,
  };
}
