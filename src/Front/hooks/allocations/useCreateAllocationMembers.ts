import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useLoggedUser } from 'hooks/index';
import {
  Allocation,
  AllocationCreateResponse,
  AllocationUser,
  MutationCallbacks,
} from 'types/index';
import { INTERNAL_MULESOFT_URL } from 'constants/index';

import useGetAllocationDetails from './useGetAllocationDetails';

type MutationPayload = {
  orderNumber: string;
  productSku: string;
  members: AllocationUser[];
};

const createAllocationMembers = async (payload: MutationPayload) => {
  const response = await fetch(`${INTERNAL_MULESOFT_URL}/b2b/createAllocationMembers`, {
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

export default function useCreateAllocationMembers(callbacks?: MutationCallbacks<number, Error>) {
  const queryClient = useQueryClient();

  const { externalID } = useLoggedUser();
  const { allocationKey } = useGetAllocationDetails();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async ({
      members,
      orderNumber,
      productSku,
    }: {
      members: AllocationUser[];
      orderNumber: string;
      productSku: string;
    }) => {
      if (!externalID) {
        throw new Error('Error while creating allocation member: invalid parameters');
      }

      const data = await createAllocationMembers({ orderNumber, productSku, members });

      if ((data.errors || []).length) {
        throw `Error while user creation: ${data.errors}`;
      }

      return data as AllocationCreateResponse;
    },
    onSuccess: (data, variables) => {
      if (!data.success) {
        if (callbacks?.onError) {
          callbacks.onError({ message: data.message || '', name: 'create-allocation-error' });
        }

        return;
      }

      if (allocationKey) {
        queryClient.setQueryData(allocationKey, (allocation: Allocation) => {
          const newUserArray = variables.members || [];
          const filteredUsers = [...allocation.users].filter(
            ({ email }) => !newUserArray.some((newUser) => newUser?.email === email)
          );

          return {
            ...allocation,
            users: [...filteredUsers, ...newUserArray],
          };
        });
      }

      if (callbacks?.onSuccess) {
        callbacks.onSuccess(variables.members.length);
      }
    },
    onError: callbacks?.onError,
  });

  return {
    createAllocationMembers: mutate,
    isCreatingAllocationMember: isPending,
    isCreateAllocationMembersSuccess: isSuccess,
  };
}
