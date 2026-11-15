import { mapAccountContactRelationsToAccounts } from './mapFromAccountContactRelations';
import type { AuthorizedBuyerAccount, AuthorizedBuyerResponse } from './types';

const fetchLiveAuthorizedBuyerAccounts = async (
  buyerId: string
): Promise<AuthorizedBuyerAccount[]> => {
  if (typeof window === 'undefined' || !buyerId) {
    return [];
  }

  try {
    const response = await fetch('/api/salesforce/user/getAccountData');

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
  buyerId: string
): Promise<AuthorizedBuyerResponse> => {
  const accounts = await fetchLiveAuthorizedBuyerAccounts(buyerId);

  return {
    buyerId,
    accounts,
  };
};
