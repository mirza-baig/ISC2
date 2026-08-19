import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { useLoggedUser } from 'hooks/index';
import { useAllocationDetails } from 'providers/index';
import {
  ALLOCATION_DETAIL_ORDER_NUMBER,
  ALLOCATION_DETAIL_PRODUCT_SKU,
  INTERNAL_MULESOFT_URL,
} from 'constants/index';
import {
  MutationCallbacks,
  Allocation,
  AllocationDeleteResponse,
  AllocationUser,
  SalesforceAllocationDetailsGetApi,
} from 'types/index';
import { getShortIsoDate } from 'utils/index';

import useGetAllocationDetails from './useGetAllocationDetails';

type MutationPayload = {
  orderNumber: string;
  productSku: string;
  memberToDelete: AllocationUser;
};

const deleteAllocation = async (payload: MutationPayload) => {
  const response = await fetch(`${INTERNAL_MULESOFT_URL}/b2b/deleteAllocationMember`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    console.error('Error while deleting user from allocation list:', data.error);
    throw data.error;
  }

  return data;
};

export default function useDeleteAllocation(callbacks?: MutationCallbacks) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { externalID, email: userEmail } = useLoggedUser();
  const { allocatedList } = useAllocationDetails();
  const { allocationKey } = useGetAllocationDetails();

  const productSku = searchParams?.get(ALLOCATION_DETAIL_PRODUCT_SKU) || '';
  const orderNumber = searchParams?.get(ALLOCATION_DETAIL_ORDER_NUMBER) || '';

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (email: string) => {
      if (!externalID || !userEmail) {
        throw new Error('Error while deleting user: invalid parameters');
      }

      const cachedData = allocationKey
        ? queryClient.getQueryData<SalesforceAllocationDetailsGetApi>(allocationKey)
        : undefined;
      if (
        cachedData?.isOrderExpired ||
        (cachedData?.expirationDate && cachedData.expirationDate < getShortIsoDate(new Date(), '-'))
      ) {
        throw new Error('Cannot remove users from an expired allocation');
      }

      const memberToDelete = allocatedList.find((item) => item.email === email);

      if (!memberToDelete) {
        throw `Member is not allocated`;
      }

      const data = await deleteAllocation({
        orderNumber,
        productSku,
        memberToDelete,
      });

      if ((data.errors || []).length) {
        throw `Error while deleting user: ${data.errors}`;
      }

      return data as AllocationDeleteResponse;
    },
    onSuccess: (data) => {
      if (allocationKey) {
        queryClient.setQueryData(allocationKey, (allocation: Allocation) => {
          const { deletedMemberInfo: user } = data;
          const filteredUsers = [...allocation.users].filter(({ email }) => email !== user.email);

          return {
            ...allocation,
            allocationSummary: data.allocationSummary,
            users: [...filteredUsers, user],
          };
        });
      }

      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }
    },
    onError: callbacks?.onError,
  });

  return {
    deleteAllocation: mutate,
    deleteAllocationAsync: mutateAsync,
    isDeletingAllocation: isPending,
  };
}
