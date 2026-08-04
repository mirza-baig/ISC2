import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { State } from 'types/index';

type CountryWithStatesInfo = {
  countryCode: string;
  states: State[];
};

export type QueryResponse = Record<string, CountryWithStatesInfo['states']>;

type UseGetAllStatesOptions = {
  enabled?: boolean;
};

const mapStates = (data?: CountryWithStatesInfo[]): QueryResponse => {
  if (!data) {
    return {};
  }
  return data.reduce(
    (accum, item) => ({
      ...accum,
      [item.countryCode]: item.states,
    }),
    {}
  );
};

export default function useGetAllStates({ enabled = true }: UseGetAllStatesOptions = {}) {
  const { data, isLoading, error } = useQuery<QueryResponse>({
    queryKey: [QUERY_KEYS.ALL_STATES],
    queryFn: async () => {
      const response = await fetch(`${INTERNAL_MULESOFT_URL}/country-details/getAllStates`, {
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

      return mapStates(data);
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    enabled,
  });

  return {
    allStates: data,
    isGettingAllStates: isLoading,
    allStatesError: error,
  };
}
