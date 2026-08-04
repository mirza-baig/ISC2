import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { Country } from 'types/index';

type UseGetAllCountriesOptions = {
  enabled?: boolean;
};

export default function useGetAllCountries({ enabled = true }: UseGetAllCountriesOptions = {}) {
  const { data, isLoading, error } = useQuery<Country[]>({
    queryKey: [QUERY_KEYS.ALL_COUNTRIES],
    queryFn: async () => {
      const response = await fetch(`${INTERNAL_MULESOFT_URL}/country-details/getAllCountries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.error) {
        console.error(data.error);
        throw data.error;
      }

      return data;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    enabled,
  });

  return {
    allCountries: data,
    isGettingAllCountries: isLoading,
    allCountriesError: error,
  };
}
