import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { B2B_FEATURE_FLAG, QUERY_KEYS } from 'constants/index';
import { CAD_CURRENCY_FEATURE_FLAG } from 'utils/currencies';
import {
  getAuthorizedBuyerAccounts,
  resolveAccountCurrency,
  type AuthorizedBuyerResponse,
} from 'lib/authorizedBuyer';

import useLoggedUser from '../useLoggedUser';

export default function useRefreshShopperOrganizationCurrency() {
  const { externalID, email } = useLoggedUser();
  const { shopperContext, setShopperContext } = useShopperContext();
  const isB2BFlowEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const isCadEnabled = useFeatureFlag(CAD_CURRENCY_FEATURE_FLAG);

  const organization = shopperContext?.organization;
  const isOrganizationSession = shopperContext?.type === 'organization' && Boolean(organization);

  const { data } = useQuery<AuthorizedBuyerResponse>({
    queryKey: [QUERY_KEYS.AUTHORIZED_BUYER_ACCOUNTS, externalID, email],
    queryFn: () => getAuthorizedBuyerAccounts(externalID!),
    enabled: isB2BFlowEnabled && isOrganizationSession && Boolean(externalID) && Boolean(email),
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!isB2BFlowEnabled || !organization || !isOrganizationSession) {
      return;
    }

    const liveCurrency = resolveAccountCurrency(
      data?.accounts.find(({ accountId }) => accountId === organization.id)?.currency,
      isCadEnabled
    );

    if (
      liveCurrency &&
      liveCurrency !== resolveAccountCurrency(organization.currency, isCadEnabled)
    ) {
      setShopperContext({
        type: 'organization',
        organization: { ...organization, currency: liveCurrency },
      });
    }
  }, [
    data?.accounts,
    isB2BFlowEnabled,
    isCadEnabled,
    isOrganizationSession,
    organization,
    setShopperContext,
  ]);
}
