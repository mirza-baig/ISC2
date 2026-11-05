import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useShopperContext } from 'providers/index';
import {
  findAccountOwnerEmail,
  isAuthorizedBuyer as matchAuthorizedBuyer,
  mapAccountContactRelationsToAccounts,
  toAccountContactRelations,
  type AccountContactRelation,
  type AuthorizedBuyerAccount,
} from 'lib/authorizedBuyer';

import useLoggedUser from '../useLoggedUser';

type AccountDataResponse = {
  data?: {
    salesforceGetAccountData?: {
      accountContactRelations?: unknown;
    } | null;
  } | null;
};

const ACCOUNT_DATA_QUERY_KEY = 'accountData';

export type AuthorizedBuyerState = {
  isAuthorizedBuyer: boolean;
  isResolvingAuthorizedBuyer: boolean;
  relations: AccountContactRelation[];
  authorizedBuyerAccounts: AuthorizedBuyerAccount[];
  accountOwnerEmail?: string;
};

export type AuthorizedBuyerOptions = {
  enabled?: boolean;
};

export default function useAuthorizedBuyer({
  enabled = true,
}: AuthorizedBuyerOptions = {}): AuthorizedBuyerState {
  const { externalID, email } = useLoggedUser();
  const { shopperContext } = useShopperContext();

  const isQueryEnabled = enabled && Boolean(externalID);

  const { data, isLoading } = useQuery<AccountDataResponse>({
    queryKey: [ACCOUNT_DATA_QUERY_KEY, externalID],
    queryFn: async () => {
      const response = await fetch(
        `/api/salesforce/user/getAccountData?externalID=${encodeURIComponent(
          externalID ?? ''
        )}&email=${encodeURIComponent(email ?? '')}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }

      return response.json();
    },
    enabled: isQueryEnabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const rawRelations = data?.data?.salesforceGetAccountData?.accountContactRelations;

  const relations = useMemo(() => toAccountContactRelations(rawRelations), [rawRelations]);

  const authorizedBuyerAccounts = useMemo(
    () => mapAccountContactRelationsToAccounts(rawRelations),
    [rawRelations]
  );

  const selectedAccountId = shopperContext?.organization?.id;

  const hasRole = useMemo(
    () => matchAuthorizedBuyer(relations, selectedAccountId),
    [relations, selectedAccountId]
  );

  const accountOwnerEmail = useMemo(
    () => findAccountOwnerEmail(relations, selectedAccountId),
    [relations, selectedAccountId]
  );

  return {
    isAuthorizedBuyer: hasRole,
    isResolvingAuthorizedBuyer: isQueryEnabled && isLoading,
    relations,
    authorizedBuyerAccounts,
    accountOwnerEmail,
  };
}
