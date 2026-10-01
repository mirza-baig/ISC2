import { mapAccountContactRelationsToAccounts } from './mapFromAccountContactRelations';
import type { AuthorizedBuyerAccount, AuthorizedBuyerResponse } from './types';

export type GetAuthorizedBuyerAccountsOptions = {
  /** Contact email for live `getAccountData`. Required to resolve Salesforce orgs. */
  email?: string;
};

const fetchLiveAuthorizedBuyerAccounts = async (
  buyerId: string,
  email?: string
): Promise<AuthorizedBuyerAccount[]> => {
  if (typeof window === 'undefined' || !buyerId || !email) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/salesforce/user/getAccountData?externalID=${encodeURIComponent(
        buyerId
      )}&email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const relations = payload?.data?.salesforceGetAccountData?.accountContactRelations;

    return mapAccountContactRelationsToAccounts(relations);
  } catch (error) {
    console.error('Failed to load live authorized buyer accounts', error);

    return [];
  }
};

export const getAuthorizedBuyerAccounts = async (
  buyerId: string,
  options?: GetAuthorizedBuyerAccountsOptions
): Promise<AuthorizedBuyerResponse> => {
  const accounts = await fetchLiveAuthorizedBuyerAccounts(buyerId, options?.email);

  return {
    buyerId,
    accounts,
  };
};
