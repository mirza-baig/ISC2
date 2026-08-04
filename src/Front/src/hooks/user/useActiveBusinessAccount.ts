import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCart, useShopperContext } from 'providers/index';
import { Address } from 'types/index';
import { COURSE_DELIVERY_PRODUCT_TYPES, OTP_ACCOUNT_TYPE, QUERY_KEYS } from 'constants/index';
import {
  getAuthorizedBuyerAccounts,
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
};

/**
 * Reads an account purchase control that may arrive as a Salesforce Boolean or as a
 * Yes/No picklist — `PO_Required__c` is a picklist while `PO_Attachment_Required__c` is
 * a checkbox, so a plain truthiness check would read the string "No" as true.
 */
const isAccountFlagSet = (value?: boolean | string) => {
  if (typeof value === 'string') {
    return ['true', 'yes', '1'].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

/**
 * Resolves the business account the current checkout is being made against — the one the
 * buyer picked in the shopper context modal — and the purchase controls derived from it.
 *
 * Accounts come from the Authorized Buyer service, which is mocked in `lib/authorizedBuyer`
 * until MuleSoft is ready; swapping in the real call leaves this hook untouched.
 */
export default function useActiveBusinessAccount(): ActiveBusinessAccount {
  const { externalID } = useLoggedUser();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();

  const selectedAccountId = shopperContext?.organization?.id;

  const { data } = useQuery<AuthorizedBuyerResponse>({
    queryKey: [QUERY_KEYS.AUTHORIZED_BUYER_ACCOUNTS, externalID],
    queryFn: () => getAuthorizedBuyerAccounts(externalID!),
    enabled: Boolean(externalID) && Boolean(selectedAccountId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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

  return {
    account,
    accountName: account?.accountName || shopperContext?.organization?.name || '',
    shippingAddress,
    isPoRequired: isAccountFlagSet(account?.purchaseControls?.poRequired),
    isPoAttachmentRequired: isAccountFlagSet(account?.purchaseControls?.poAttachmentRequired),
    isCourseDeliveryDateRequired: isOtpAccount && hasCourseDeliveryProduct,
  };
}
