import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from 'constants/index';
import { getServiceLayerAPI } from 'utils/index';

const query = async () => {
  const api = await getServiceLayerAPI();
  const { data } = await api.post('', {
    query: 'GET_CURRENCIES',
  });

  return data?.data?.project?.currencies || [];
};

export default function useGetCurrencies() {
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.CURRENCIES],
    queryFn: query,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    currencies: data || [],
    currenciesIsLoading: isLoading,
    currenciesErrors: error,
  };
}
