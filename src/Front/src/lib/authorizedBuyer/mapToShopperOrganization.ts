import type { ShopperOrganization } from 'providers/shopperContext';

import type { AuthorizedBuyerAccount } from './types';

/** Map MuleSoft account → thin shopper-context org used by the modal/banner. */
export const mapAccountToShopperOrganization = (
  account: AuthorizedBuyerAccount
): ShopperOrganization => ({
  id: account.accountId,
  name: account.accountName,
  creditHold: account.creditHold,
  accountType: account.accountType,
  currency: account.currency,
  pricingTier: account.pricingTier,
});

export const mapAccountsToShopperOrganizations = (
  accounts: AuthorizedBuyerAccount[]
): ShopperOrganization[] => accounts.map(mapAccountToShopperOrganization);
