import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { LOCALSTORAGE_KEYS, QUERY_KEYS } from 'constants/index';
import { Cart, Order, ServiceLayerResponse } from 'types/index';
import {
  addComputedFieldsToLineItems,
  getComputedFieldsFromCart,
  getCurrencySymbol,
  getServiceLayerAPI,
  parsePrice,
} from 'utils/index';
import useLoggedUser from 'hooks/useLoggedUser';

type OrderWithCart = Order & { cartISC2: Cart };

type GetOrderResponse = ServiceLayerResponse<{ order: OrderWithCart }>;

export default function useGetOrder(orderNumber: string) {
  const { externalID, email } = useLoggedUser();
  const canGetOrder = Boolean(orderNumber && externalID && email);

  const { data, isLoading, error, isSuccess } = useQuery<OrderWithCart>({
    queryKey: [QUERY_KEYS.ORDER, orderNumber, externalID, email],
    queryFn: async () => {
      const api = await getServiceLayerAPI();

      try {
        const { data } = await api.post<GetOrderResponse>('', {
          query: 'GET_ORDER',
          variables: {
            orderNumber,
            locale: 'en',
            externalId: externalID,
            email,
          },
        });

        if ((data.errors || []).length) {
          throw data.errors[0];
        }

        localStorage.removeItem(LOCALSTORAGE_KEYS.ORDER_NUMBER);
        return data.data.order;
      } catch (error) {
        console.error('Error during get order', error);
        throw error;
      }
    },
    enabled: canGetOrder,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const orderComputed = useMemo(() => {
    return {
      currencySymbol: getCurrencySymbol(data?.totalPrice.currencyCode || 'USD'),
      totalPrice: parsePrice(data?.totalPrice.centAmount, data?.totalPrice.fractionDigits),
    };
  }, [data]);

  const cart = useMemo(() => {
    if (data) {
      return addComputedFieldsToLineItems(data.cartISC2);
    }

    return null;
  }, [data]);

  const cartComputed = useMemo(() => getComputedFieldsFromCart(cart, isSuccess), [cart, isSuccess]);

  return {
    isGettingOrder: Boolean(orderNumber) && (!canGetOrder || isLoading),
    getOrderError: error,
    order: data && { ...data, computed: orderComputed },
    orderCart: { ...cart, computed: cartComputed },
  };
}
