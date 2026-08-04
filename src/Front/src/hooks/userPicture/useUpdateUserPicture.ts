import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { UpdateUserPicturePayload } from 'types/index';
import useLoggedUser from 'hooks/useLoggedUser';

export default function useUpdateUserPicture() {
  const { externalID, email } = useLoggedUser();
  const queryClient = useQueryClient();

  const { isPending, error, mutate, mutateAsync } = useMutation({
    mutationFn: async (payload: Partial<UpdateUserPicturePayload>) => {
      if (!externalID || !email) {
        throw new Error('Error while updating user picture: invalid parameters');
      }

      const response = await fetch(`${INTERNAL_MULESOFT_URL}/user/updateUserPicture`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalID,
          email,
          pictureData: payload,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw `Error while updating user picture: ${data.error}`;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PICTURE] });
    },
  });

  return {
    updateUserPicture: mutate,
    updateUserPictureAsync: mutateAsync,
    isUpdatingUserPicture: isPending,
    updateUserPictureError: error,
  };
}
