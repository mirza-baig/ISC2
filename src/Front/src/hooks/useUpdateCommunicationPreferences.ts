import { useMutation, useQueryClient } from '@tanstack/react-query';
import useLoggedUser from './useLoggedUser';
import { INTERNAL_MULESOFT_URL } from 'constants/urls';

interface CommunicationPreferences {
  certificationResources: boolean;
  continuingEducation: boolean;
  memberOffers: boolean;
  newsAndResources: boolean;
  centerForCyber: boolean;
}

export default function useUpdateCommunicationPreferences() {
  const { externalID, email } = useLoggedUser();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async (preferences: CommunicationPreferences) => {
      const response = await fetch(
        `${INTERNAL_MULESOFT_URL}/user/updateCommunicationPreferences?externalID=${externalID}&email=${email}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountData', externalID] });
    },
  });

  return {
    updateCommunicationPreferences: mutate,
    updateCommunicationPreferencesAsync: mutateAsync,
    isUpdatingCommunicationPreferences: isPending,
    updateCommunicationPreferencesError: error,
  };
}
