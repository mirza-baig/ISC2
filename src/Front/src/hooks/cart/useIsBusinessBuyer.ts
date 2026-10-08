import { useMemo, useState, useEffect } from 'react';

import { useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';

import useLoggedUser from '../useLoggedUser';
import useAuthorizedBuyer from '../user/useAuthorizedBuyer';
import useIsCpqStyleCheckout from './useIsCpqStyleCheckout';

export function useBusinessBuyerResolution() {
  const { isB2BAdminUser } = useLoggedUser();
  const { shopperContext, isShopperContextReady } = useShopperContext();
  const { isAuthorizedBuyer, isResolvingAuthorizedBuyer } = useAuthorizedBuyer();
  const isCpqStyleCheckout = useIsCpqStyleCheckout();
  const isB2BFlowEnabled = useFeatureFlag('B2B_Company_Flow');
  const [forceB2BClient, setForceB2BClient] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('forceB2B=true')) {
      setForceB2BClient(true);
    }
  }, []);

  const forceB2BEnv = process.env.NEXT_PUBLIC_FORCE_B2B === 'true';
  const isShoppingForOrganization =
    shopperContext?.type === 'organization' && Boolean(shopperContext.organization);

  const isBusinessBuyer = useMemo(() => {
    if (!isB2BFlowEnabled) {
      return false;
    }

    if (isCpqStyleCheckout) {
      return false;
    }

    const isEligible = isB2BAdminUser || isAuthorizedBuyer;

    return (isEligible && isShoppingForOrganization) || forceB2BEnv || forceB2BClient;
  }, [
    isB2BFlowEnabled,
    isCpqStyleCheckout,
    isB2BAdminUser,
    isAuthorizedBuyer,
    isShoppingForOrganization,
    forceB2BEnv,
    forceB2BClient,
  ]);

  // Hold the confirmation screen on the loader until the organization selection is known.
  // Otherwise the individual page renders for the gap before storage is read, then swaps.
  const isResolvingBusinessBuyer =
    isB2BFlowEnabled &&
    !isCpqStyleCheckout &&
    !forceB2BEnv &&
    !forceB2BClient &&
    (!isShopperContextReady ||
      (isShoppingForOrganization && !isB2BAdminUser && isResolvingAuthorizedBuyer));

  return {
    isBusinessBuyer,
    isResolvingBusinessBuyer,
    // Order custom fields can select the business confirmation before shopper context resolves.
    // CPQ and a disabled company flow stay on the individual confirmation.
    isB2BConfirmationEnabled: isB2BFlowEnabled && !isCpqStyleCheckout,
  };
}

export default function useIsBusinessBuyer() {
  return useBusinessBuyerResolution().isBusinessBuyer;
}
