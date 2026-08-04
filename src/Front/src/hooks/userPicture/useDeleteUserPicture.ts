import { useMutation, useQueryClient } from '@tanstack/react-query';
import useLoggedUser from '../useLoggedUser';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';

const deleteUserPicture = async (externalID: string, email: string) => {
  const response = await fetch(
    `${INTERNAL_MULESOFT_URL}/user/deleteUserPicture?externalID=${externalID}&email=${email}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();

  if (data.error) {
    console.error('Error while deleting user picture:', data.error);
    throw data.error;
  }

  return data;
};

export default function useDeleteUserPicture() {
  const { externalID, email } = useLoggedUser();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async () => {
      if (!externalID || !email) {
        throw new Error('Error while deleting user picture: invalid parameters');
      }

      const data = await deleteUserPicture(externalID, email);

      if (data.error) {
        throw `Error while deleting user picture: ${data.error}`;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PICTURE] });
    },
  });

  return {
    deleteUserPicture: mutate,
    isDeletingUserPicture: isPending,
    deleteUserPictureAsync: mutateAsync,
    deleteUserPictureError: error,
  };
}
