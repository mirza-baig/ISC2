import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { B2B_FEATURE_FLAG, QUERY_KEYS } from 'constants/index';
import { PrintableOrder } from 'types/index';
import { useFeatureFlag } from 'providers/featureFlags';
import {
  getServiceLayerAPI,
  normalizePrintableOrder,
  collapseSalesforceOrderShells,
} from 'utils/index';
import { MOCK_ORDERS } from '../../mocks/orders.mock';
import { useLoggedUser } from '..';

type GetAllOrdersResponse = {
  orders: PrintableOrder[] | [];
};

const isMockOrdersEnabled = () => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_ORDERS === 'true') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.search.includes('useMockOrders=true');
};

const prepareOrders = (orders: PrintableOrder[], isB2BOrderHistoryEnabled: boolean) =>
  isB2BOrderHistoryEnabled ? collapseSalesforceOrderShells(orders) : orders;

export default function useGetAllOrders() {
  const { externalID, email } = useLoggedUser();
  const isB2BOrderHistoryEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const [useMocks, setUseMocks] = useState(process.env.NEXT_PUBLIC_USE_MOCK_ORDERS === 'true');
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setUseMocks(isMockOrdersEnabled());
    setIsClientReady(true);
  }, []);

  const { data, isLoading, error } = useQuery<GetAllOrdersResponse>({
    queryKey: [QUERY_KEYS.ALL_ORDERS, useMocks, externalID, email, isB2BOrderHistoryEnabled],
    queryFn: async () => {
      if (useMocks) {
        return {
          orders: prepareOrders(MOCK_ORDERS.map(normalizePrintableOrder), isB2BOrderHistoryEnabled),
        };
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
          orders: prepareOrders(
            (ordersData || []).map(normalizePrintableOrder),
            isB2BOrderHistoryEnabled
          ),
        };
      } catch (requestError) {
        console.error('Error during get all orders', requestError);
        throw requestError;
      }
    },
    enabled: isClientReady && (Boolean(externalID) || useMocks),
    refetchOnWindowFocus: false,
    refetchOnMount: isB2BOrderHistoryEnabled,
  });

  return {
    isGettingAllOrders: isLoading,
    getAllOrdersError: error,
    orders: data?.orders || [],
  };
}
