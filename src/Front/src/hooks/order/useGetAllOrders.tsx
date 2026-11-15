import { useQuery } from '@tanstack/react-query';
import { B2B_FEATURE_FLAG, QUERY_KEYS } from 'constants/index';
import { PrintableOrder } from 'types/index';
import { useFeatureFlag } from 'providers/featureFlags';
import {
  getServiceLayerAPI,
  normalizePrintableOrder,
  collapseSalesforceOrderShells,
} from 'utils/index';
import { useLoggedUser } from '..';

type GetAllOrdersResponse = {
  orders: PrintableOrder[] | [];
};

export default function useGetAllOrders() {
  const { externalID, email } = useLoggedUser();
  const isB2BOrderHistoryEnabled = useFeatureFlag(B2B_FEATURE_FLAG);

  const { data, isLoading, error } = useQuery<GetAllOrdersResponse>({
    queryKey: [QUERY_KEYS.ALL_ORDERS, externalID, email, isB2BOrderHistoryEnabled],
    queryFn: async () => {
      const api = await getServiceLayerAPI();

      try {
        const orderResponse = await api.post('', {
          query: isB2BOrderHistoryEnabled ? 'GET_ALL_ORDERS' : 'GET_ALL_ORDERS_WITHOUT_B2B_FIELDS',
        });

        const ordersData: PrintableOrder[] = orderResponse?.data?.data?.salesforceGetOrders || [];

        return {
          orders: isB2BOrderHistoryEnabled
            ? collapseSalesforceOrderShells(ordersData.map(normalizePrintableOrder))
            : ordersData,
        };
      } catch (requestError) {
        console.error('Error during get all orders', requestError);
        throw requestError;
      }
    },
    enabled: Boolean(externalID),
    refetchOnWindowFocus: false,
    refetchOnMount: isB2BOrderHistoryEnabled,
  });

  return {
    isGettingAllOrders: isLoading,
    getAllOrdersError: error,
    orders: data?.orders || [],
  };
}
