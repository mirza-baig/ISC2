import { useMemo } from 'react';

import { useCart, useShopperContext } from 'providers/index';

import useLoggedUser from '../useLoggedUser';

/**
 * A business buyer is someone who is eligible to shop for an organization — a B2B admin
 * contact or a CPQ/quote cart — and who chose "My Organization" in the shopper context
 * modal. Eligibility alone is not enough: a B2B admin buying their own certification is
 * shopping as an individual.
 *
 * Mirrors the condition in BuyerContextBanner so the "Shopping for:" banner and the
 * purchase information form can never disagree.
 */
export default function useIsBusinessBuyer() {
  const { isB2BAdminUser } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();

  return useMemo(() => {
    const isEligible = isB2BAdminUser || Boolean(activeCart?.computed?.isB2B);
    const isShoppingForOrganization =
      shopperContext?.type === 'organization' && Boolean(shopperContext.organization);

    return isEligible && isShoppingForOrganization;
  }, [isB2BAdminUser, activeCart?.computed?.isB2B, shopperContext]);
}
