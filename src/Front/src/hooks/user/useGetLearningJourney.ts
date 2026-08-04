import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { LearningJourneyElement } from 'types/index';
import useLoggedUser from 'hooks/useLoggedUser';
import { isOldUserExternalId } from 'utils/index';

type GetLearningJourneyResponse = LearningJourneyElement[];

const getLearningJourney = async (externalID?: string, email?: string) => {
  if (!externalID || !email) {
    throw new Error('Error while fetching learning journey data');
  }

  if (isOldUserExternalId(externalID)) {
    throw new Error(`Invalid externalID while fetching learning journey: ${externalID}`);
  }

  const response = await fetch(
    `${INTERNAL_MULESOFT_URL}/user/getLearningJourney?externalID=${externalID}&email=${email}`,
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
    throw 'Error while fetching learning journey data';
  }

  return data;
};

export default function useGetLearningJourney() {
  const { externalID, email } = useLoggedUser();

  const { data, isLoading, error } = useQuery<GetLearningJourneyResponse>({
    queryKey: [QUERY_KEYS.LEARNING_JOURNEY],
    queryFn: async () => getLearningJourney(externalID, email),
    enabled: Boolean(externalID),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  return {
    learningJourneyProducts: data || [],
    isGettingLearningJourneyProducts: isLoading,
    getLearningJourneyProductsError: error,
  };
}
