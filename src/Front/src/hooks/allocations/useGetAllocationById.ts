import { useQuery } from '@tanstack/react-query';
import { INTERNAL_MULESOFT_URL, QUERY_KEYS } from 'constants/index';
import { SalesforceAllocationDetailsGetApi } from 'types/index';
import useLoggedUser from 'hooks/useLoggedUser';

export default function useGetAllocationById({ allocationId }: { allocationId: string }) {
  const { externalID } = useLoggedUser();

  const { data, isLoading, error } = useQuery<SalesforceAllocationDetailsGetApi>({
    queryKey: [QUERY_KEYS.ALLOCATION_BY_ID, allocationId],
    queryFn: async () => {
      const response = await fetch(
        `${INTERNAL_MULESOFT_URL}/b2b/getAllocationById?allocationId=${allocationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();

      if (data.error) {
        console.error(data.error);
        throw data.error;
      }

      return data;
    },
    enabled: Boolean(externalID && allocationId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  return {
    allocation: data ?? null,
    isGettingAllocation: isLoading,
    allocationError: error,
  };
}
