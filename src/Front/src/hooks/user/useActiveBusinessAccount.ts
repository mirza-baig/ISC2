import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCart, useShopperContext } from 'providers/index';
import { Address, CartLineItem, LineItem } from 'types/index';
import { useFeatureFlag } from 'providers/featureFlags';
import {
  B2B_FEATURE_FLAG,
  COURSE_DELIVERY_KIT_SKU_MARKER,
  COURSE_DELIVERY_PRODUCT_TYPES,
  COURSE_DELIVERY_SKU_GATED_PRODUCT_TYPES,
  OTP_ACCOUNT_TYPE,
  QUERY_KEYS,
} from 'constants/index';
import {
  getAuthorizedBuyerAccounts,
  isAccountFlagSet,
  type AuthorizedBuyerAccount,
  type AuthorizedBuyerResponse,
} from 'lib/authorizedBuyer';

import useLoggedUser from '../useLoggedUser';

type ActiveBusinessAccount = {
  account?: AuthorizedBuyerAccount;
  accountName: string;
  taxExempt: boolean;
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

const hasKitMarker = (sku?: string) =>
  Boolean(sku?.toUpperCase().includes(COURSE_DELIVERY_KIT_SKU_MARKER));

const isCourseDeliveryLine = (lineItem: LineItem, bundleSku?: string): boolean => {
  const typeName = (lineItem.productType?.name || '').toLowerCase();

  if (COURSE_DELIVERY_PRODUCT_TYPES.includes(typeName)) {
    return true;
  }

  return (
    COURSE_DELIVERY_SKU_GATED_PRODUCT_TYPES.includes(typeName) &&
    (hasKitMarker(lineItem.variant?.sku) || hasKitMarker(bundleSku))
  );
};
const cartHasCourseDeliveryProduct = (lineItems?: CartLineItem[]): boolean =>
  (lineItems || []).some((lineItem) =>
    'products' in lineItem
      ? lineItem.products.some((product) => isCourseDeliveryLine(product, lineItem.bundleSku))
      : isCourseDeliveryLine(lineItem)
  );

/**
 * Resolves the business account the current checkout is being made against — the one the
 * buyer picked in the shopper context modal — and the purchase controls derived from it.
 *
 * Accounts are live `getAccountData` relations.
 * Balances refresh on checkout step mount and window focus. There is no frontend
 * reservation; Salesforce must reject a second debit if two buyers confirm together.
 */
export default function useActiveBusinessAccount(): ActiveBusinessAccount {
  const { externalID, email } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);

  const selectedAccountId = shopperContext?.organization?.id;

  const { data, refetch } = useQuery<AuthorizedBuyerResponse>({
    queryKey: [QUERY_KEYS.AUTHORIZED_BUYER_ACCOUNTS, externalID, email],
    queryFn: () => getAuthorizedBuyerAccounts(externalID!),
    enabled:
      isB2BFeatureEnabled && Boolean(externalID) && Boolean(email) && Boolean(selectedAccountId),
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
    () => cartHasCourseDeliveryProduct(activeCart?.lineItems),
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
    taxExempt: Boolean(account?.taxExempt),
    shippingAddress,
    isPoRequired: isAccountFlagSet(account?.purchaseControls?.poRequired),
    isPoAttachmentRequired: isAccountFlagSet(account?.purchaseControls?.poAttachmentRequired),
    isCourseDeliveryDateRequired: isOtpAccount && hasCourseDeliveryProduct,
    refetchAccount,
  };
}
