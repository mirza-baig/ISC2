import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MutationCallbacks, UpdateUserPayload, UserData } from 'types/index';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';

import useLoggedUser from './useLoggedUser';

export default function useUpdateUserData(callbacks?: MutationCallbacks) {
  const { externalID, email } = useLoggedUser();
  const queryClient = useQueryClient();

  const { isPending, error, mutate, mutateAsync } = useMutation({
    mutationFn: async (payload: Partial<UpdateUserPayload>) => {
      const response = await fetch(`${INTERNAL_MULESOFT_URL}/user/updateUserData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: {
            externalId: externalID,
            email,
            ...payload,
          },
        }),
      });
      const data = await response.json();
      if ((data.errors || []).length) {
        throw `Error while updating user: ${data.errors[0].message}`;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }

      queryClient.setQueryData([QUERY_KEYS.USER_DATA], (oldUserData: UserData) => ({
        ...oldUserData,
        ...variables,
      }));
    },
    onError: callbacks?.onError,
  });

  return {
    updateUser: mutate,
    updateUserAsync: mutateAsync,
    isUpdatingUser: isPending,
    updateError: error,
  };
}
