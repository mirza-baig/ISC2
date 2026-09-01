import type { AuthorizedBuyerAccount } from './types';

const usAddress = (
  line1: string,
  city: string,
  state: string,
  postalCode: string
): AuthorizedBuyerAccount['shippingAddress'] => ({
  line1,
  city,
  state,
  postalCode,
  country: 'US',
});

const defaultPurchaseControls = (
  overrides?: Partial<AuthorizedBuyerAccount['purchaseControls']>
): AuthorizedBuyerAccount['purchaseControls'] => ({
  poRequired: true,
  poAttachmentRequired: false,
  prepaidAuthorized: true,
  ...overrides,
});

const defaultCredit = (
  overrides?: Partial<AuthorizedBuyerAccount['credit']>
): AuthorizedBuyerAccount['credit'] => ({
  paymentTerms: 'NET_30',
  creditLimit: 100000,
  creditBalance: 25000,
  availableCredit: 75000,
  ...overrides,
});

/** Reusable account fixtures — compose scenarios from these. */

export const ACCOUNT_ACME: AuthorizedBuyerAccount = {
  accountId: '001xx0000654321',
  accountName: 'Acme Corporation',
  accountOwnerEmail: 'acme.owner@isc2.org',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: true,
  shippingAddress: usAddress('123 Main Street', 'Chicago', 'IL', '60601'),
  purchaseControls: defaultPurchaseControls(),
  credit: defaultCredit(),
  prepaid: {
    expirationDate: '2026-12-31',
    balance: 15000,
    type: 'Investment',
  },
};

export const ACCOUNT_ACME_HOLD: AuthorizedBuyerAccount = {
  ...ACCOUNT_ACME,
  accountId: '001xx0000654322',
  accountName: 'Acme Global Solutions Inc',
  creditHold: true,
};

export const ACCOUNT_BUSINESS_CO_CANADA: AuthorizedBuyerAccount = {
  accountId: 'org-business-co-canada',
  accountName: 'Business Co. Canada Ltd',
  accountType: 'B2B',
  currency: 'CAD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: false,
  shippingAddress: {
    line1: '100 King Street West',
    city: 'Toronto',
    state: 'ON',
    postalCode: 'M5X 1A1',
    country: 'CA',
  },
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 50000,
    creditBalance: 10000,
    availableCredit: 40000,
  }),
};

export const ACCOUNT_NORTHWIND: AuthorizedBuyerAccount = {
  accountId: 'org-northwind-traders',
  accountName: 'Northwind Traders LLC',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_2',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('456 Harbor Ave', 'Seattle', 'WA', '98101'),
  purchaseControls: defaultPurchaseControls({ prepaidAuthorized: false }),
  credit: defaultCredit({
    paymentTerms: 'NET_45',
    creditLimit: 75000,
    creditBalance: 15000,
    availableCredit: 60000,
  }),
};

export const ACCOUNT_GLOBEX: AuthorizedBuyerAccount = {
  accountId: 'org-globex-corporation',
  accountName: 'Globex Corporation',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: true,
  shippingAddress: usAddress('1 Globex Plaza', 'Springfield', 'OR', '97477'),
  purchaseControls: defaultPurchaseControls({
    poRequired: true,
    poAttachmentRequired: true,
  }),
  credit: defaultCredit({
    creditLimit: 20000,
    creditBalance: 18000,
    availableCredit: 2000,
  }),
};

export const ACCOUNT_INITECH_HOLD: AuthorizedBuyerAccount = {
  accountId: 'org-initech-systems',
  accountName: 'Initech Systems Inc',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_2',
  creditHold: true,
  taxExempt: false,
  shippingAddress: usAddress('200 Office Park Dr', 'Austin', 'TX', '78701'),
  purchaseControls: defaultPurchaseControls(),
  credit: defaultCredit({
    creditLimit: 30000,
    creditBalance: 30000,
    availableCredit: 0,
  }),
};

export const ACCOUNT_UMBRELLA: AuthorizedBuyerAccount = {
  accountId: 'org-umbrella-industries',
  accountName: 'Umbrella Industries',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_3',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('77 Raccoon City Blvd', 'Raccoon City', 'PA', '15201'),
  purchaseControls: defaultPurchaseControls({ prepaidAuthorized: true }),
  credit: defaultCredit(),
  prepaid: {
    expirationDate: '2027-06-30',
    balance: 5000,
    type: 'Deposit',
  },
};

export const ACCOUNT_STARK: AuthorizedBuyerAccount = {
  accountId: 'org-stark-enterprises',
  accountName: 'Stark Enterprises',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: true,
  shippingAddress: usAddress('200 Park Avenue', 'New York', 'NY', '10166'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 500000,
    creditBalance: 50000,
    availableCredit: 450000,
  }),
};

/** Low / edge credit + prepaid-only style account for future checkout tickets. */
export const ACCOUNT_CREDIT_EDGE: AuthorizedBuyerAccount = {
  accountId: '001xx0000creditedge',
  accountName: 'Credit Edge Holdings',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_2',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('9 Edge Case Way', 'Denver', 'CO', '80202'),
  purchaseControls: defaultPurchaseControls({
    poRequired: true,
    poAttachmentRequired: true,
    prepaidAuthorized: true,
  }),
  credit: defaultCredit({
    paymentTerms: 'NET_15',
    creditLimit: 1000,
    creditBalance: 1000,
    availableCredit: 0,
  }),
  prepaid: {
    expirationDate: '2026-08-15',
    balance: 250,
    type: 'Investment',
  },
};

/**
 * OTP account. Checkout step one requires a Course Delivery Date for OTP buyers who have
 * a kit or exam in the cart, so this is the fixture that exercises that rule.
 */
export const ACCOUNT_OTP: AuthorizedBuyerAccount = {
  accountId: 'org-otp-training-partner',
  accountName: 'OTP Training Partner Ltd',
  accountType: 'OTP',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_2',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('55 Training Way', 'Atlanta', 'GA', '30303'),
  purchaseControls: defaultPurchaseControls({
    poRequired: true,
    poAttachmentRequired: true,
  }),
  credit: defaultCredit(),
};

/**
 * Live CloudHub shape for turbobusinessbuyer5000@mailinator.com.
 * prepaidAuthorized is still null, so prepaid stays hidden.
 * availableCredit is still null. discountPercentage is not mocked.
 */
export const ACCOUNT_OTP_SF_PARTIAL: AuthorizedBuyerAccount = {
  ...ACCOUNT_OTP,
  accountId: '001Ek000027iJTJIA2',
  accountName: 'Test OTP Business Account',
  creditHold: false,
  purchaseControls: defaultPurchaseControls({
    poRequired: true,
    poAttachmentRequired: null,
    prepaidAuthorized: null,
  }),
  credit: {
    paymentTerms: 'Net 30',
    creditLimit: 25000,
    creditBalance: null,
    availableCredit: null,
  },
  prepaid: {
    expirationDate: '2026-12-31',
    balance: 15000,
    type: 'Investment',
  },
};

export const ACCOUNT_OTP_SF_HOLD: AuthorizedBuyerAccount = {
  ...ACCOUNT_OTP_SF_PARTIAL,
  accountId: '001Ek000027j0y5IAA',
  accountName: 'Another Test OTP Business Account',
  creditHold: true,
  credit: {
    paymentTerms: 'Net 60',
    creditLimit: 10000,
    creditBalance: null,
    availableCredit: null,
  },
};

/** Non-standard account type for catalog-by-account-type scenarios. */
export const ACCOUNT_TYPE_VARIANT: AuthorizedBuyerAccount = {
  accountId: '001xx0000acctype',
  accountName: 'Academic Partners Group',
  accountType: 'ACADEMIC',
  currency: 'USD',
  pricingTier: 'ACADEMIC_1',
  creditHold: false,
  taxExempt: true,
  shippingAddress: usAddress('1 University Circle', 'Boston', 'MA', '02108'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 10000,
    creditBalance: 0,
    availableCredit: 10000,
  }),
};

/** Payment-eligibility demo orgs. Shown in the default `many` picker. */
export const ACCOUNT_DEMO_BOTH: AuthorizedBuyerAccount = {
  accountId: 'org-demo-both',
  accountName: 'BrightPath Training Inc',
  accountOwnerEmail: 'brightpath.owner@isc2.org',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('10 Lake Shore Dr', 'Chicago', 'IL', '60601'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 50000,
    creditBalance: 10000,
    availableCredit: 40000,
  }),
  prepaid: {
    expirationDate: '2026-12-31',
    balance: 15000,
    type: 'Investment',
  },
};

export const ACCOUNT_DEMO_PREPAID_INVESTMENT: AuthorizedBuyerAccount = {
  accountId: 'org-demo-prepaid-investment',
  accountName: 'Meridian Partners LLC',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('200 Market Street', 'San Francisco', 'CA', '94105'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 500,
    creditBalance: 0,
    availableCredit: 500,
  }),
  prepaid: {
    expirationDate: '2026-12-31',
    balance: 10000,
    type: 'Investment',
    discountPercentage: 10,
  },
};

export const ACCOUNT_DEMO_PREPAID_DEPOSIT: AuthorizedBuyerAccount = {
  accountId: 'org-demo-prepaid-deposit',
  accountName: 'Harbor Deposit Group',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('88 Harbor Blvd', 'Tampa', 'FL', '33602'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 500,
    creditBalance: 0,
    availableCredit: 500,
  }),
  prepaid: {
    expirationDate: '2027-06-30',
    balance: 10000,
    type: 'Deposit',
    discountPercentage: 10,
  },
};

export const ACCOUNT_DEMO_CREDIT_ONLY: AuthorizedBuyerAccount = {
  accountId: 'org-demo-credit-only',
  accountName: 'Northstar Enterprises',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_1',
  creditHold: false,
  taxExempt: false,
  shippingAddress: usAddress('1 Northstar Plaza', 'Minneapolis', 'MN', '55402'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    creditLimit: 30000,
    creditBalance: 5000,
    availableCredit: 25000,
  }),
};

export const ACCOUNT_DEMO_NEITHER: AuthorizedBuyerAccount = {
  accountId: 'org-demo-neither',
  accountName: 'Atlas Holdings Inc',
  accountType: 'B2B',
  currency: 'USD',
  pricingTier: 'ENTERPRISE_2',
  creditHold: true,
  taxExempt: false,
  shippingAddress: usAddress('400 Atlas Ave', 'Denver', 'CO', '80202'),
  purchaseControls: defaultPurchaseControls({ poRequired: false }),
  credit: defaultCredit({
    paymentTerms: 'NET_15',
    creditLimit: 1000,
    creditBalance: 1000,
    availableCredit: 0,
  }),
  prepaid: {
    expirationDate: '2026-08-15',
    balance: 250,
    type: 'Investment',
  },
};
