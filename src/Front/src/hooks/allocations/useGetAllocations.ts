import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { Allocation, SalesforceAllocationsGetApi } from 'types/index';
import useLoggedUser from 'hooks/useLoggedUser';
import { getAllocationListData } from 'utils/allocations';
import { useMemo } from 'react';
import { useUserSession } from 'providers/index';

const getAllocationList = async (externalID?: string) => {
  if (!externalID) {
    throw new Error('Error while fetching allocation list: invalid parameters');
  }

  const response = await fetch(`${INTERNAL_MULESOFT_URL}/b2b/getAllocations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!data || data.error) {
    console.error(data.error);
    throw 'Error while fetching allocation list';
  }

  return data;
};

export default function useGetAllocations({ maxQuantity }: { maxQuantity?: number }) {
  const { externalID } = useLoggedUser();
  const { isConsentAllocation } = useUserSession();

  const { data, isLoading, error } = useQuery<SalesforceAllocationsGetApi>({
    queryKey: [QUERY_KEYS.ALLOCATIONS, externalID],
    queryFn: async () => getAllocationList(externalID),
    enabled: Boolean(externalID) && Boolean(isConsentAllocation),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  const allocationList = useMemo(() => {
    if (data) {
      const allocations: Allocation[] = data ? getAllocationListData(data) : [];
      return maxQuantity ? allocations.slice(0, maxQuantity) : allocations;
    }

    return [];
  }, [data, maxQuantity]);

  return {
    allocationList,
    isGettingAllocationList: isLoading,
    allocationListError: error,
  };
}
