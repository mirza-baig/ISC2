import { useMemo } from 'react';

import { B2B_FEATURE_FLAG } from 'constants/b2b';
import { BUSINESS_PAYMENT_METHODS, BUSINESS_STEP_TWO_DEFAULT_LABELS } from 'constants/checkout';
import { buildPrepaidOrderSummary, resolvePrepaidDiscount } from 'lib/authorizedBuyer';
import { useFeatureFlag } from 'providers/featureFlags';
import { useCart, useCheckoutProcess } from 'providers/index';
import { CartLineItem } from 'types/index';
import { getCartDiscountCentAmount, getPrepaidDiscountCentAmount, parsePrice } from 'utils/index';

import { hasPrepaidDiscount } from '../cart/useDiscountPercentage';

import useBusinessPaymentEligibility from './useBusinessPaymentEligibility';

export type PrepaidCheckoutSummaryDisplay = {
  title: string;
  discountAmount: string;
  total?: string;
  isOnCart: boolean;
};

export default function usePrepaidCheckoutSummary(): PrepaidCheckoutSummaryDisplay | null {
  const { selectedPaymentMethod, stepTwoLabels } = useCheckoutProcess();
  const { account, cartTotal } = useBusinessPaymentEligibility();
  const { activeCart } = useCart();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);

  return useMemo(() => {
    if (selectedPaymentMethod !== BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT) {
      return null;
    }

    const label =
      stepTwoLabels.prepaidDiscountLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidDiscountLabel;
    if (hasPrepaidDiscount(activeCart)) {
      const lineItems = (activeCart.lineItems ?? []) as CartLineItem[];
      const discountPercent = resolvePrepaidDiscount(account?.prepaid);
      const fractionDigits = activeCart.totalPrice?.fractionDigits ?? 2;
      const discountCentAmount =
        isB2BFeatureEnabled && discountPercent
          ? getPrepaidDiscountCentAmount(lineItems, discountPercent)
          : getCartDiscountCentAmount(lineItems);

      if (discountCentAmount <= 0) {
        return null;
      }

      return {
        title: discountPercent ? `${label} (${discountPercent}%)` : label,
        discountAmount: parsePrice(discountCentAmount, fractionDigits),
        isOnCart: true,
      };
    }

    if (isB2BFeatureEnabled) {
      return null;
    }

    const summary = buildPrepaidOrderSummary(cartTotal, account?.prepaid);

    if (!summary) {
      return null;
    }

    return {
      title: `${label} (${summary.discountPercent}%)`,
      discountAmount: summary.discountAmount,
      total: summary.amountDue,
      isOnCart: false,
    };
  }, [
    account?.prepaid,
    activeCart,
    cartTotal,
    isB2BFeatureEnabled,
    selectedPaymentMethod,
    stepTwoLabels.prepaidDiscountLabel,
  ]);
}
