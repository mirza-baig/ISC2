import { useQuery } from '@tanstack/react-query';
import useLoggedUser from './useLoggedUser';

interface CommunicationPreferences {
  certificationResources: boolean;
  continuingEducation: boolean;
  memberOffers: boolean;
  newsAndResources: boolean;
  centerForCyber: boolean;
}

/**
 * Salesforce B2B account relationship. `roles` is a semicolon-delimited multi-picklist
 * (e.g. "Allocator;Authorized Buyer") — split on `;` before comparing.
 */
export interface AccountContactRelation {
  accountId?: string;
  accountName?: string;
  roles?: string | null;
  accountType?: string;
}

interface AccountData {
  data: {
    salesforceGetAccountData: {
      communicationPreferences: CommunicationPreferences;
      boardElectionEligible?: boolean;
      bodNominationAccess?: boolean;
      PreferredLanguage?: string;
      accountContactRelations?: AccountContactRelation[];
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
