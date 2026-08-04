import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import {
  ALLOCATION_DETAIL_ORDER_NUMBER,
  ALLOCATION_DETAIL_PRODUCT_SKU,
  QUERY_KEYS,
  INTERNAL_MULESOFT_URL,
} from 'constants/index';
import { SalesforceAllocationDetailsGetApi } from 'types/index';
import { useLoggedUser } from 'hooks/index';
import { getAllocationDetailsData } from 'utils/index';
import { useUserSession } from 'providers/index';

type QueryPayload = {
  orderNumber: string;
  externalID?: string;
  productSku: string;
};

const getAllocationDetails = async ({ orderNumber, externalID, productSku }: QueryPayload) => {
  if (!externalID) {
    throw new Error('Error while fetching the allocation details: invalid parameters');
  }

  const response = await fetch(
    `${INTERNAL_MULESOFT_URL}/b2b/getAllocationDetails?orderNumber=${orderNumber}&productSku=${productSku}`,
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
};

export default function useGetAllocationDetails() {
  const searchParams = useSearchParams();
  const { externalID } = useLoggedUser();
  const { isConsentAllocation } = useUserSession();

  const productSku = searchParams?.get(ALLOCATION_DETAIL_PRODUCT_SKU) || '';
  const orderNumber = searchParams?.get(ALLOCATION_DETAIL_ORDER_NUMBER) || '';

  const allocationKey = useMemo(() => {
    if (externalID && productSku && orderNumber) {
      return [QUERY_KEYS.ALLOCATIONS, orderNumber, externalID, productSku];
    }

    return null;
  }, [externalID, orderNumber, productSku]);

  const { data, isLoading, error } = useQuery<SalesforceAllocationDetailsGetApi>({
    queryKey: allocationKey ?? [],
    queryFn: async () => getAllocationDetails({ externalID, productSku, orderNumber }),
    enabled: Boolean(allocationKey) && Boolean(isConsentAllocation),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  const allocationDetails = useMemo(() => {
    if (data) {
      return getAllocationDetailsData(data, orderNumber);
    }

    return undefined;
  }, [data, orderNumber]);

  return {
    allocationKey,
    allocationDetails,
    isGettingAllocationDetails: isLoading,
    allocationDetailsError: error,
  };
}
