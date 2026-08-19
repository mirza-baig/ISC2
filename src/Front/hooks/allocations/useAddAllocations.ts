import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { useLoggedUser } from 'hooks/index';
import { MutationCallbacks } from 'types/index';
import {
  Allocation,
  AllocationAddResponse,
  AllocationUser,
  SalesforceAllocationDetailsGetApi,
} from 'types/index';
import {
  ALLOCATION_DETAIL_ORDER_NUMBER,
  ALLOCATION_DETAIL_PRODUCT_SKU,
  INTERNAL_MULESOFT_URL,
} from 'constants/index';
import { getShortIsoDate } from 'utils/index';

import useGetAllocationDetails from './useGetAllocationDetails';

type MutationPayload = {
  orderNumber: string;
  productSku: string;
  members: AllocationUser[];
};

const addAllocation = async (payload: MutationPayload) => {
  const response = await fetch(`${INTERNAL_MULESOFT_URL}/b2b/addAllocationMembers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    console.error('Error while adding user:', data.error);
    throw data.error;
  }

  return data;
};

export default function useAddAllocations(callbacks?: MutationCallbacks<number, Error>) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { externalID } = useLoggedUser();
  const { allocationKey } = useGetAllocationDetails();

  const productSku = searchParams?.get(ALLOCATION_DETAIL_PRODUCT_SKU) || '';
  const orderNumber = searchParams?.get(ALLOCATION_DETAIL_ORDER_NUMBER) || '';

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationKey: [productSku, orderNumber, externalID],
    mutationFn: async (members: AllocationUser[]) => {
      if (!externalID) {
        throw new Error('Error while allocating user: invalid paramter');
      }

      const cachedData = allocationKey
        ? queryClient.getQueryData<SalesforceAllocationDetailsGetApi>(allocationKey)
        : undefined;
      if (
        cachedData?.isOrderExpired ||
        (cachedData?.expirationDate && cachedData.expirationDate < getShortIsoDate(new Date(), '-'))
      ) {
        throw new Error('Cannot allocate users to an expired allocation');
      }

      const data = await addAllocation({ orderNumber, productSku, members });

      if ((data.errors || []).length) {
        throw `Error while allocating user: ${data.errors}`;
      }

      return data as AllocationAddResponse;
    },
    onSuccess: (data) => {
      if (allocationKey) {
        queryClient.setQueryData(allocationKey, (allocation: Allocation) => {
          const newUsers = (data.allocatedUsers || []).map(({ memberInfo }) => memberInfo);
          const filteredUsers = allocation.users.filter(
            (user) => !newUsers.some((newUser) => newUser?.email === user?.email)
          );

          return {
            ...allocation,
            allocationSummary: data.allocationSummary,
            users: [...filteredUsers, ...newUsers],
          };
        });
      }

      if (callbacks?.onSuccess) {
        callbacks.onSuccess(data.allocatedUsers.length);
      }
    },
    onError: callbacks?.onError,
  });

  return {
    addAllocation: mutate,
    addAllocationAsync: mutateAsync,
    isAddingAllocation: isPending,
  };
}
