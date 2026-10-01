/** MuleSoft Authorized Buyer response shape. */

export type AuthorizedBuyerAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AuthorizedBuyerPurchaseControls = {
  poRequired: boolean;
  poAttachmentRequired: boolean | null;
  prepaidAuthorized: boolean | null;
};

export type AuthorizedBuyerCredit = {
  paymentTerms: string;
  creditLimit: number | null;
  creditBalance: number | null;
  availableCredit: number | null;
};

export type AuthorizedBuyerPrepaid = {
  expirationDate: string | null;
  balance: number | null;
  type?: string | null;
  discountPercentage?: number | null;
};

export type AuthorizedBuyerCategoryPricing = {
  productCategory: string;
  discountTier: string;
  discountPercent: number;
};

export type AuthorizedBuyerAccount = {
  accountId: string;
  accountName: string;
  accountType: string;
  currency: string;
  pricingTier: string;
  creditHold: boolean;
  taxExempt: boolean;
  shippingAddress: AuthorizedBuyerAddress;
  purchaseControls: AuthorizedBuyerPurchaseControls;
  credit: AuthorizedBuyerCredit;
  prepaid?: AuthorizedBuyerPrepaid;
  taxId?: string;
  intacctCustomerId?: string;
};

export type AuthorizedBuyerResponse = {
  buyerId: string;
  accounts: AuthorizedBuyerAccount[];
};
