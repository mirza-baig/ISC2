import { useCallback, useMemo } from 'react';

import { BUSINESS_PAYMENT_METHODS } from 'constants/index';
import { B2B_FEATURE_FLAG } from 'constants/b2b';
import {
  isPreapprovedCreditEligible,
  isPrepaidAccountEligible,
  resolveAvailableCredit,
  resolvePrepaidDiscount,
  amountDueWithPrepaid,
  toFiniteNumber,
  type AuthorizedBuyerAccount,
} from 'lib/authorizedBuyer';
import { useCart } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';

import useIsBusinessBuyer from '../cart/useIsBusinessBuyer';
import useActiveBusinessAccount from '../user/useActiveBusinessAccount';

const toCartTotal = (value: number | string | undefined) => {
  const total = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(total) ? total : 0;
};

export default function useBusinessPaymentEligibility() {
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const isBusinessBuyer = useIsBusinessBuyer();
  const { activeCart } = useCart();
  const { account, refetchAccount } = useActiveBusinessAccount();

  const hasTaxedTotal = Boolean(activeCart?.taxedPrice);
  // Prepaid / credit stay hidden until tax is on the cart so the compare is cart + tax.
  const canOfferBusinessPayment = isB2BFeatureEnabled && isBusinessBuyer && hasTaxedTotal;
  const cartTotal = toCartTotal(activeCart?.computed?.totalPrice);

  const isPrepaidEligible = canOfferBusinessPayment && isPrepaidAccountEligible(account, cartTotal);

  const isCreditEligible =
    canOfferBusinessPayment && isPreapprovedCreditEligible(account, cartTotal);

  const prepaidBalance = canOfferBusinessPayment
    ? toFiniteNumber(account?.prepaid?.balance) ?? undefined
    : undefined;
  const availableCredit = canOfferBusinessPayment
    ? resolveAvailableCredit(account?.credit) ?? undefined
    : undefined;
  const prepaidDiscount = canOfferBusinessPayment
    ? resolvePrepaidDiscount(account?.prepaid) ?? undefined
    : undefined;
  const prepaidAmountDue = canOfferBusinessPayment
    ? amountDueWithPrepaid(cartTotal, account?.prepaid)
    : cartTotal;

  const recheckMethod = useCallback(
    async (method: BUSINESS_PAYMENT_METHODS) => {
      if (!isB2BFeatureEnabled) {
        return false;
      }

      const freshAccount: AuthorizedBuyerAccount | undefined = await refetchAccount();
      const latest = freshAccount ?? account;
      const latestTotal = toCartTotal(activeCart?.computed?.totalPrice);

      if (method === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT) {
        return isPrepaidAccountEligible(latest, latestTotal);
      }

      return isPreapprovedCreditEligible(latest, latestTotal);
    },
    [account, activeCart?.computed?.totalPrice, isB2BFeatureEnabled, refetchAccount]
  );

  return useMemo(
    () => ({
      account,
      cartTotal,
      isPrepaidEligible,
      isCreditEligible,
      prepaidBalance,
      availableCredit,
      prepaidDiscount,
      prepaidAmountDue,
      recheckMethod,
    }),
    [
      account,
      cartTotal,
      isPrepaidEligible,
      isCreditEligible,
      prepaidBalance,
      availableCredit,
      prepaidDiscount,
      prepaidAmountDue,
      recheckMethod,
    ]
  );
}
