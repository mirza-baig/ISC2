import { useMemo, useState, useEffect } from 'react';

import { useCart, useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';

import useLoggedUser from '../useLoggedUser';

export default function useIsBusinessBuyer() {
  const { isB2BAdminUser } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();
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

    const forceB2BEnv = process.env.NEXT_PUBLIC_FORCE_B2B === 'true';

    const isEligible = isB2BAdminUser || Boolean(activeCart?.computed?.isB2B);
    const isShoppingForOrganization =
      shopperContext?.type === 'organization' && Boolean(shopperContext.organization);

    return (isEligible && isShoppingForOrganization) || forceB2BEnv || forceB2BClient;
  }, [
    isB2BFlowEnabled,
    isB2BAdminUser,
    activeCart?.computed?.isB2B,
    shopperContext,
    forceB2BClient,
  ]);
}
