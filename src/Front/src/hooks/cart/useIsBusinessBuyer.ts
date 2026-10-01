import { useMemo, useState, useEffect } from 'react';

import { useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';

import useLoggedUser from '../useLoggedUser';
import useAuthorizedBuyer from '../user/useAuthorizedBuyer';
import useIsCpqStyleCheckout from './useIsCpqStyleCheckout';

export default function useIsBusinessBuyer() {
  const { isB2BAdminUser } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const { isAuthorizedBuyer } = useAuthorizedBuyer();
  const isCpqStyleCheckout = useIsCpqStyleCheckout();
  const isB2BFlowEnabled = useFeatureFlag('B2B_Company_Flow');
  const [forceB2BClient, setForceB2BClient] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('forceB2B=true')) {
      setForceB2BClient(true);
    }
  }, []);

  return useMemo(() => {
    if (!isB2BFlowEnabled) {
      return false;
    }

    if (isCpqStyleCheckout) {
      return false;
    }

    const forceB2BEnv = process.env.NEXT_PUBLIC_FORCE_B2B === 'true';

    const isEligible = isB2BAdminUser || isAuthorizedBuyer;
    const isShoppingForOrganization =
      shopperContext?.type === 'organization' && Boolean(shopperContext.organization);

    return (isEligible && isShoppingForOrganization) || forceB2BEnv || forceB2BClient;
  }, [
    isB2BFlowEnabled,
    isCpqStyleCheckout,
    isB2BAdminUser,
    isAuthorizedBuyer,
    shopperContext,
    forceB2BClient,
  ]);
}
