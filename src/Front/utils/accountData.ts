import { AccountContactRelation } from 'types/index';

import { getIsAuthorizedBuyer } from './userRoles';

type MulesoftAccountDataResponse = {
  data?: {
    salesforceGetAccountData?: {
      accountContactRelations?: AccountContactRelation[];
    };
  };
  error?: string;
  message?: string;
  Description?: string;
};

export const fetchAccountDataFromMulesoft = async (
  externalID: string,
  email: string
): Promise<MulesoftAccountDataResponse> => {
  const response = await fetch(
    `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/user/accountData?externalID=${encodeURIComponent(
      externalID
    )}&email=${encodeURIComponent(email)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
        client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
      },
    }
  );

  const data: MulesoftAccountDataResponse = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(
      `Error while fetching account data: ${data?.error || data?.message || data?.Description}`
    );
  }

  return data;
};

export const getIsAuthorizedBuyerFromMulesoft = async (
  externalID?: string,
  email?: string
): Promise<boolean> => {
  if (!externalID || !email) {
    return false;
  }

  try {
    const data = await fetchAccountDataFromMulesoft(externalID, email);

    return getIsAuthorizedBuyer(data?.data?.salesforceGetAccountData?.accountContactRelations);
  } catch (error) {
    console.error('Error while resolving authorized buyer role:', error);

    return false;
  }
};
