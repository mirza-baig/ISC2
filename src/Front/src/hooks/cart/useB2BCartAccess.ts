import { useCallback, useMemo } from 'react';

import { useFeatureFlag } from 'providers/featureFlags';
import { useShopperContext } from 'providers/shopperContext';
import { B2B_FEATURE_FLAG } from 'constants/b2b';

import useAuthorizedBuyer from '../user/useAuthorizedBuyer';

import {
  canEditQuantityForBuyerContext,
  resolveBuyerContext,
  type BuyerContext,
} from './b2bBuyerContext';
import {
  DEFAULT_MAX_LINE_QUANTITY,
  clampToAtLeastOne,
  type ClampQuantity,
} from './b2bLineQuantity';

export { DEFAULT_MAX_LINE_QUANTITY };
export type { BuyerContext };

export type B2BCartAccess = {
  isFeatureEnabled: boolean;
  isAuthorizedBuyer: boolean;
  isResolvingAccess: boolean;
  showB2BCart: boolean;
  buyerContext: BuyerContext | null;
  canEditQuantity: boolean;
  maxLineQuantity: number | null;
  clampQuantity: ClampQuantity;
};

export default function useB2BCartAccess(): B2BCartAccess {
  const isFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const { shopperContext } = useShopperContext();
  const { isAuthorizedBuyer, isResolvingAuthorizedBuyer } = useAuthorizedBuyer({
    enabled: isFeatureEnabled,
  });

  const buyerContext = resolveBuyerContext(shopperContext?.type);
  const hasBuyerPrivileges = isFeatureEnabled && isAuthorizedBuyer;
  const canEditQuantity = canEditQuantityForBuyerContext(hasBuyerPrivileges, buyerContext);

  const maxLineQuantity = canEditQuantity ? null : DEFAULT_MAX_LINE_QUANTITY;

  const clampQuantity = useCallback(
    (quantity: number) => {
      const atLeastOne = clampToAtLeastOne(quantity);

      return maxLineQuantity === null ? atLeastOne : Math.min(atLeastOne, maxLineQuantity);
    },
    [maxLineQuantity]
  );

  return useMemo(
    () => ({
      isFeatureEnabled,
      isAuthorizedBuyer,
      isResolvingAccess: isResolvingAuthorizedBuyer,
      showB2BCart: isFeatureEnabled,
      buyerContext,
      canEditQuantity,
      maxLineQuantity,
      clampQuantity,
    }),
    [
      isFeatureEnabled,
      isAuthorizedBuyer,
      isResolvingAuthorizedBuyer,
      buyerContext,
      canEditQuantity,
      maxLineQuantity,
      clampQuantity,
    ]
  );
}
