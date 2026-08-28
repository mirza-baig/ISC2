import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { QUERY_KEYS } from 'constants/index';
import { PrintableOrder } from 'types/index';
import { getServiceLayerAPI } from 'utils/index';
import { MOCK_ORDERS } from '../../mocks/orders.mock';
import { useLoggedUser } from '..';

type GetAllOrdersResponse = {
  orders: PrintableOrder[] | [];
};

export default function useGetAllOrders() {
  const { externalID, email } = useLoggedUser();
  const [useMockClient, setUseMockClient] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('useMockOrders=true')) {
      setUseMockClient(true);
    }
  }, []);

  const useMocks = process.env.NEXT_PUBLIC_USE_MOCK_ORDERS === 'true' || useMockClient;

  const { data, isLoading, error } = useQuery<GetAllOrdersResponse>({
    queryKey: [QUERY_KEYS.ALL_ORDERS, useMocks],
    queryFn: async () => {
      if (useMocks) {
        return { orders: MOCK_ORDERS };
      }

      const api = await getServiceLayerAPI();

      try {
        const orderResponse = await api.post('', {
          query: 'GET_ALL_ORDERS',
          variables: {
            externalId: externalID,
            email,
          },
        });

        const ordersData: PrintableOrder[] | undefined =
          orderResponse?.data?.data?.salesforceGetOrders;

        return {
          orders: ordersData || [],
        };
      } catch (requestError) {
        console.error('Error during get all orders', requestError);
        throw requestError;
      }
    },
    enabled: Boolean(externalID) || useMocks,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    isGettingAllOrders: isLoading,
    getAllOrdersError: error,
    orders: data?.orders || [],
  };
}
