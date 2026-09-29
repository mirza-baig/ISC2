import { useMemo } from 'react';

import { BUSINESS_PAYMENT_METHODS, BUSINESS_STEP_TWO_DEFAULT_LABELS } from 'constants/checkout';
import { buildPrepaidOrderSummary, resolvePrepaidDiscount } from 'lib/authorizedBuyer';
import { useCart, useCheckoutProcess } from 'providers/index';
import { CartLineItem } from 'types/index';
import { getCartDiscountCentAmount, parsePrice } from 'utils/index';

import { hasPrepaidDiscount } from '../cart/useDiscountPercentage';

import useBusinessPaymentEligibility from './useBusinessPaymentEligibility';

export type PrepaidCheckoutSummaryDisplay = {
  title: string;
  discountAmount: string;
  /** Replaces the cart total; undefined once the discount is on the cart (it is the total). */
  total?: string;
  /** The discount is already in the cart's prices: show it above Subtotal, like the receipt. */
  isOnCart: boolean;
};

export default function usePrepaidCheckoutSummary(): PrepaidCheckoutSummaryDisplay | null {
  const { selectedPaymentMethod, stepTwoLabels } = useCheckoutProcess();
  const { account, cartTotal } = useBusinessPaymentEligibility();
  const { activeCart } = useCart();

  return useMemo(() => {
    if (selectedPaymentMethod !== BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT) {
      return null;
    }

    const label =
      stepTwoLabels.prepaidDiscountLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidDiscountLabel;

    // The discount is in the cart's prices: report what commercetools took off (10% of the
    // pre-tax price) instead of taking 10% off the already-discounted, taxed total again.
    if (hasPrepaidDiscount(activeCart)) {
      const lineItems = (activeCart.lineItems ?? []) as CartLineItem[];
      const discountPercent = resolvePrepaidDiscount(account?.prepaid);
      const fractionDigits = activeCart.totalPrice?.fractionDigits ?? 2;

      return {
        title: discountPercent ? `${label} (${discountPercent}%)` : label,
        discountAmount: parsePrice(getCartDiscountCentAmount(lineItems), fractionDigits),
        isOnCart: true,
      };
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
    selectedPaymentMethod,
    stepTwoLabels.prepaidDiscountLabel,
  ]);
}
