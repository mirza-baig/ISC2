import { useMemo } from 'react';

import { BUSINESS_PAYMENT_METHODS, BUSINESS_STEP_TWO_DEFAULT_LABELS } from 'constants/checkout';
import { buildPrepaidOrderSummary } from 'lib/authorizedBuyer';
import { useCheckoutProcess } from 'providers/index';

import useBusinessPaymentEligibility from './useBusinessPaymentEligibility';

export type PrepaidCheckoutSummaryDisplay = {
  title: string;
  discountAmount: string;
  total: string;
};

export default function usePrepaidCheckoutSummary(): PrepaidCheckoutSummaryDisplay | null {
  const { selectedPaymentMethod, stepTwoLabels } = useCheckoutProcess();
  const { account, cartTotal } = useBusinessPaymentEligibility();

  return useMemo(() => {
    if (selectedPaymentMethod !== BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT) {
      return null;
    }

    const summary = buildPrepaidOrderSummary(cartTotal, account?.prepaid);

    if (!summary) {
      return null;
    }

    const label =
      stepTwoLabels.prepaidDiscountLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidDiscountLabel;

    return {
      title: `${label} (${summary.discountPercent}%)`,
      discountAmount: summary.discountAmount,
      total: summary.amountDue,
    };
  }, [account?.prepaid, cartTotal, selectedPaymentMethod, stepTwoLabels.prepaidDiscountLabel]);
}
