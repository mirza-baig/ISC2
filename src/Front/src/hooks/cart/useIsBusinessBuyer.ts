import { useMemo, useState, useEffect } from 'react';

import { useCart, useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { CartWithComputedData } from 'types/index';

import useLoggedUser from '../useLoggedUser';

type BusinessBuyerOptions = {
  /**
   * Cart to judge B2B eligibility from. Defaults to the live cart. Screens that describe
   * a cart other than the shopper's current one — the order confirmation, where the live
   * cart is the empty one created after checkout — pass the cart they actually render.
   */
  cart?: CartWithComputedData | null;
};

export type BusinessBuyerStatus = {
  isBusinessBuyer: boolean;
  /**
   * `true` while the answer is still unknowable. Screens that render a different layout
   * per variant must hold their loading state on this, or they paint the consumer
   * variant first and swap once the shopper context arrives.
   */
  isResolvingBusinessBuyer: boolean;
};

export function useBusinessBuyerStatus({ cart }: BusinessBuyerOptions = {}): BusinessBuyerStatus {
  const { isB2BAdminUser } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext, isShopperContextResolved } = useShopperContext();
  const isB2BFlowEnabled = useFeatureFlag('B2B_Company_Flow');
  const [forceB2BClient, setForceB2BClient] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('forceB2B=true')) {
      setForceB2BClient(true);
    }
  }, []);

  const eligibilityCart = cart ?? activeCart;

  return useMemo(() => {
    if (!isB2BFlowEnabled) {
      return { isBusinessBuyer: false, isResolvingBusinessBuyer: false };
    }

    const forceB2BEnv = process.env.NEXT_PUBLIC_FORCE_B2B === 'true';

    if (forceB2BEnv || forceB2BClient) {
      return { isBusinessBuyer: true, isResolvingBusinessBuyer: false };
    }

    const isEligible = isB2BAdminUser || Boolean(eligibilityCart?.computed?.isB2B);
    const isShoppingForOrganization =
      shopperContext?.type === 'organization' && Boolean(shopperContext.organization);

    return {
      isBusinessBuyer: isEligible && isShoppingForOrganization,
      isResolvingBusinessBuyer: !isShopperContextResolved,
    };
  }, [
    isB2BFlowEnabled,
    isB2BAdminUser,
    eligibilityCart?.computed?.isB2B,
    shopperContext,
    isShopperContextResolved,
    forceB2BClient,
  ]);
}

export default function useIsBusinessBuyer(): boolean {
  return useBusinessBuyerStatus().isBusinessBuyer;
}
