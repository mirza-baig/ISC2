import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { UserPicture } from 'types/index';
import useLoggedUser from '../useLoggedUser';
import { buildBase64Image } from 'utils/image';
import { isOldUserExternalId } from 'utils/index';

const query = async (externalID?: string, email?: string) => {
  if (!externalID || !email) {
    throw new Error('Error while fetching user picture: invalid parameters');
  }

  if (isOldUserExternalId(externalID)) {
    throw new Error(`Invalid externalID while fetching user picture: ${externalID}`);
  }

  const response = await fetch(
    `${INTERNAL_MULESOFT_URL}/user/getUserPicture?externalID=${externalID}&email=${email}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!data || data.error) {
    console.error(data.error);
    throw 'Error while fetching user picture';
  }

  return data;
};

export default function useUserPicture() {
  const { user, externalID, email } = useLoggedUser();

  const { data, isLoading, error, isRefetching } = useQuery<UserPicture>({
    queryKey: [QUERY_KEYS.USER_PICTURE],
    queryFn: () => query(externalID, email),
    enabled: Boolean(externalID),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    retryOnMount: false,
  });

  return {
    userPicture: {
      src: data?.base64 ? buildBase64Image(data?.base64) : null,
      alt: user?.fullName,
    },
    isBeingApproved: data?.isLoading,
    isGettingUserPicture: isLoading,
    getUserPictureError: error,
    isRefetchingUserPicture: isRefetching,
  };
}
