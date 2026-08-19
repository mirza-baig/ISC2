import { useMemo } from 'react';

import { useCart, useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';

import useLoggedUser from '../useLoggedUser';

export default function useIsBusinessBuyer() {
  const { isB2BAdminUser } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();
  const isB2BFlowEnabled = useFeatureFlag('B2B_Company_Flow');
  return useMemo(() => {
    if (!isB2BFlowEnabled) {
      return false;
    }

    const isEligible = isB2BAdminUser || Boolean(activeCart?.computed?.isB2B);
    const isShoppingForOrganization =
      shopperContext?.type === 'organization' && Boolean(shopperContext.organization);

    return isEligible && isShoppingForOrganization;
  }, [isB2BFlowEnabled, isB2BAdminUser, activeCart?.computed?.isB2B, shopperContext]);
}
