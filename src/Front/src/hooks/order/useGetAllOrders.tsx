import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from 'constants/index';
import { PrintableOrder } from 'types/index';
import { getServiceLayerAPI } from 'utils/index';
import { useLoggedUser } from '..';

type GetAllOrdersResponse = {
  orders: PrintableOrder[] | [];
};

export default function useGetAllOrders() {
  const { externalID, email } = useLoggedUser();

  const { data, isLoading, error } = useQuery<GetAllOrdersResponse>({
    queryKey: [QUERY_KEYS.ALL_ORDERS],
    queryFn: async () => {
      const api = await getServiceLayerAPI();

      try {
        const orderResponse = await api.post('', {
          query: 'GET_ALL_ORDERS',
          variables: {
            externalId: externalID,
            email,
          },
        });

        const ordersData = orderResponse?.data?.data?.salesforceGetOrders;

        return {
          orders: ordersData,
        };
      } catch (error) {
        console.error('Error during get all orders', error);
        throw error;
      }
    },
    enabled: Boolean(externalID),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    isGettingAllOrders: isLoading,
    getAllOrdersError: error,
    orders: data?.orders || [],
  };
}
