/** MuleSoft Authorized Buyer response shape (mocked until the service is ready). */

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
  poAttachmentRequired: boolean;
  prepaidAuthorized: boolean;
};

export type AuthorizedBuyerCredit = {
  paymentTerms: string;
  creditLimit: number;
  creditBalance: number;
  availableCredit: number;
};

export type AuthorizedBuyerPrepaid = {
  expirationDate: string;
  balance: number;
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
};

export type AuthorizedBuyerResponse = {
  buyerId: string;
  accounts: AuthorizedBuyerAccount[];
};

/**
 * Named mock scenarios for local/QA use.
 * Override via `?buyerScenario=` or `NEXT_PUBLIC_BUYER_MOCK_SCENARIO`.
 */
export const BUYER_MOCK_SCENARIOS = [
  'zero',
  'single',
  'single-credit-hold',
  'many',
  'many-all-hold',
  'pricing-variants',
  'account-type-variants',
  'credit-edge',
  'purchase-controls',
] as const;

export type BuyerMockScenario = (typeof BUYER_MOCK_SCENARIOS)[number];

export const DEFAULT_BUYER_MOCK_SCENARIO: BuyerMockScenario = 'many';

export const isBuyerMockScenario = (value: string): value is BuyerMockScenario =>
  (BUYER_MOCK_SCENARIOS as readonly string[]).includes(value);
