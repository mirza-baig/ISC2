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
