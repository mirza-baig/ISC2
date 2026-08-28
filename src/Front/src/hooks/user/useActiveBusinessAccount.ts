import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCart, useShopperContext } from 'providers/index';
import { Address } from 'types/index';
import { COURSE_DELIVERY_PRODUCT_TYPES, OTP_ACCOUNT_TYPE, QUERY_KEYS } from 'constants/index';
import {
  getAuthorizedBuyerAccounts,
  isAccountFlagSet,
  resolveBuyerMockScenario,
  type AuthorizedBuyerAccount,
  type AuthorizedBuyerResponse,
} from 'lib/authorizedBuyer';

import useLoggedUser from '../useLoggedUser';

type ActiveBusinessAccount = {
  account?: AuthorizedBuyerAccount;
  accountName: string;
  /** The account's shipping address, or undefined while the payload has none. */
  shippingAddress?: Address;
  /** Account purchase controls. Default to false so a missing payload never blocks checkout. */
  isPoRequired: boolean;
  isPoAttachmentRequired: boolean;
  isCourseDeliveryDateRequired: boolean;
  /** Re-reads Mule + mocks. `ok` is false when the refresh fails (submit must not place). */
  refetchAccount: () => Promise<{
    account?: AuthorizedBuyerAccount;
    ok: boolean;
  }>;
};

/**
 * Resolves the business account the current checkout is being made against — the one the
 * buyer picked in the shopper context modal — and the purchase controls derived from it.
 *
 * Accounts are live `getAccountData` relations (first) plus the mock playbook.
 * Balances refresh on checkout step mount and window focus. There is no frontend
 * reservation; Salesforce must reject a second debit if two buyers confirm together.
 */
export default function useActiveBusinessAccount(): ActiveBusinessAccount {
  const { externalID, email } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();

  const selectedAccountId = shopperContext?.organization?.id;

  const mockScenario = resolveBuyerMockScenario();

  const { data, refetch } = useQuery<AuthorizedBuyerResponse>({
    queryKey: [QUERY_KEYS.AUTHORIZED_BUYER_ACCOUNTS, externalID, email, mockScenario],
    queryFn: () => getAuthorizedBuyerAccounts(externalID!, { email }),
    enabled: Boolean(externalID) && Boolean(email) && Boolean(selectedAccountId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });

  const account = useMemo(
    () => data?.accounts.find(({ accountId }) => accountId === selectedAccountId),
    [data?.accounts, selectedAccountId]
  );

  const hasCourseDeliveryProduct = useMemo(
    () =>
      Boolean(
        activeCart?.lineItems?.some(({ productType }) =>
          COURSE_DELIVERY_PRODUCT_TYPES.includes((productType?.name || '').toLowerCase())
        )
      ),
    [activeCart?.lineItems]
  );

  const shippingAddress = useMemo(() => {
    const address = account?.shippingAddress;

    if (!address?.line1) {
      return undefined;
    }

    return {
      street: address.line1,
      streetTwo: address.line2 || '',
      city: address.city || '',
      stateCode: address.state || '',
      postalCode: address.postalCode || '',
      countryCode: address.country || '',
    };
  }, [account?.shippingAddress]);

  // Account type also rides along on the shopper context selection, so the OTP rule still
  // resolves while the full account payload is in flight.
  const accountType = account?.accountType || shopperContext?.organization?.accountType || '';
  const isOtpAccount = accountType.toLowerCase() === OTP_ACCOUNT_TYPE;

  const refetchAccount = useCallback(async () => {
    const result = await refetch();
    const account = result.data?.accounts.find(({ accountId }) => accountId === selectedAccountId);

    return {
      account,
      ok: !result.isError && Boolean(result.data),
    };
  }, [refetch, selectedAccountId]);

  return {
    account,
    accountName: account?.accountName || shopperContext?.organization?.name || '',
    shippingAddress,
    isPoRequired: isAccountFlagSet(account?.purchaseControls?.poRequired),
    isPoAttachmentRequired: isAccountFlagSet(account?.purchaseControls?.poAttachmentRequired),
    isCourseDeliveryDateRequired: isOtpAccount && hasCourseDeliveryProduct,
    refetchAccount,
  };
}
