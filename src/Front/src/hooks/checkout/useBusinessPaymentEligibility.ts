import { useCallback, useMemo } from 'react';

import { BUSINESS_PAYMENT_METHODS } from 'constants/index';
import { B2B_FEATURE_FLAG } from 'constants/b2b';
import {
  isPreapprovedCreditEligible,
  isPrepaidAccountEligible,
  markBuyerMockRaceDeplete,
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

const toOptionalAmount = (value: number | null): number | undefined => value ?? undefined;

export default function useBusinessPaymentEligibility() {
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const isBusinessBuyer = useIsBusinessBuyer();
  const { activeCart } = useCart();
  const { account, refetchAccount } = useActiveBusinessAccount();

  const hasTaxedTotal = Boolean(activeCart?.taxedPrice);
  // Same compare for catalog and CPQ carts. CPQ draw-down is visible after Mule/SF updates
  // because this hook re-reads account data on payment-step mount, window focus, and submit.
  const canOfferBusinessPayment = isB2BFeatureEnabled && isBusinessBuyer && hasTaxedTotal;
  const cartTotal = toCartTotal(activeCart?.computed?.totalPrice);

  const isPrepaidEligible = canOfferBusinessPayment && isPrepaidAccountEligible(account, cartTotal);

  const isCreditEligible =
    canOfferBusinessPayment && isPreapprovedCreditEligible(account, cartTotal);

  const prepaidBalance = canOfferBusinessPayment
    ? toOptionalAmount(toFiniteNumber(account?.prepaid?.balance))
    : undefined;
  const creditLimit = canOfferBusinessPayment
    ? toOptionalAmount(toFiniteNumber(account?.credit?.creditLimit))
    : undefined;
  const availableCredit = canOfferBusinessPayment
    ? toOptionalAmount(resolveAvailableCredit(account?.credit))
    : undefined;
  const prepaidDiscount = canOfferBusinessPayment
    ? toOptionalAmount(resolvePrepaidDiscount(account?.prepaid))
    : undefined;
  const prepaidAmountDue = canOfferBusinessPayment
    ? amountDueWithPrepaid(cartTotal, account?.prepaid)
    : cartTotal;

  const recheckMethod = useCallback(
    async (method: BUSINESS_PAYMENT_METHODS) => {
      if (!isB2BFeatureEnabled) {
        return false;
      }

      markBuyerMockRaceDeplete();

      const { account: freshAccount, ok } = await refetchAccount();

      if (!ok) {
        return false;
      }

      const latest: AuthorizedBuyerAccount | undefined = freshAccount ?? account;
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
      creditLimit,
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
      creditLimit,
      availableCredit,
      prepaidDiscount,
      prepaidAmountDue,
      recheckMethod,
    ]
  );
}
