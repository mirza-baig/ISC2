import { useQuery } from '@tanstack/react-query';
import useLoggedUser from './useLoggedUser';

interface CommunicationPreferences {
  certificationResources: boolean;
  continuingEducation: boolean;
  memberOffers: boolean;
  newsAndResources: boolean;
  centerForCyber: boolean;
}

interface AccountData {
  data: {
    salesforceGetAccountData: {
      communicationPreferences: CommunicationPreferences;
      boardElectionEligible?: boolean;
      bodNominationAccess?: boolean;
      PreferredLanguage?: string;
    };
  };
}

export default function useGetAccountData() {
  const { externalID, email } = useLoggedUser();

  return useQuery<AccountData>({
    queryKey: ['accountData', externalID],
    queryFn: async () => {
      const response = await fetch(
        `/api/salesforce/user/getAccountData?externalID=${externalID}&email=${email}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }
      return response.json();
    },
    enabled: !!externalID,
  });
}
