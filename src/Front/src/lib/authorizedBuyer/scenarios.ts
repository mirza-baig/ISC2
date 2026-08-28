import {
  ACCOUNT_ACME,
  ACCOUNT_ACME_HOLD,
  ACCOUNT_BUSINESS_CO_CANADA,
  ACCOUNT_CREDIT_EDGE,
  ACCOUNT_GLOBEX,
  ACCOUNT_INITECH_HOLD,
  ACCOUNT_NORTHWIND,
  ACCOUNT_OTP,
  ACCOUNT_OTP_SF_HOLD,
  ACCOUNT_OTP_SF_PARTIAL,
  ACCOUNT_STARK,
  ACCOUNT_TYPE_VARIANT,
  ACCOUNT_UMBRELLA,
  ACCOUNT_DEMO_BOTH,
  ACCOUNT_DEMO_PREPAID_INVESTMENT,
  ACCOUNT_DEMO_PREPAID_DEPOSIT,
  ACCOUNT_DEMO_CREDIT_ONLY,
  ACCOUNT_DEMO_NEITHER,
} from './accounts';
import type { AuthorizedBuyerAccount, BuyerMockScenario } from './types';

/**
 * Scenario → account list.
 * `many` mirrors the previous hardcoded modal list (mix of hold / non-hold).
 */
export const BUYER_SCENARIO_ACCOUNTS: Record<BuyerMockScenario, AuthorizedBuyerAccount[]> = {
  zero: [],
  single: [ACCOUNT_ACME],
  'single-credit-hold': [ACCOUNT_ACME_HOLD],
  many: [
    ACCOUNT_DEMO_BOTH,
    ACCOUNT_DEMO_PREPAID_INVESTMENT,
    ACCOUNT_DEMO_PREPAID_DEPOSIT,
    ACCOUNT_DEMO_CREDIT_ONLY,
    ACCOUNT_DEMO_NEITHER,
    ACCOUNT_BUSINESS_CO_CANADA,
    ACCOUNT_ACME_HOLD,
    ACCOUNT_NORTHWIND,
    ACCOUNT_GLOBEX,
    ACCOUNT_INITECH_HOLD,
    ACCOUNT_UMBRELLA,
    ACCOUNT_STARK,
  ],
  'many-all-hold': [
    { ...ACCOUNT_BUSINESS_CO_CANADA, creditHold: true },
    ACCOUNT_ACME_HOLD,
    ACCOUNT_INITECH_HOLD,
  ],
  'pricing-variants': [
    ACCOUNT_ACME,
    ACCOUNT_NORTHWIND,
    ACCOUNT_UMBRELLA,
    { ...ACCOUNT_STARK, pricingTier: 'ENTERPRISE_3' },
  ],
  'account-type-variants': [ACCOUNT_ACME, ACCOUNT_TYPE_VARIANT, ACCOUNT_OTP],
  'credit-edge': [ACCOUNT_CREDIT_EDGE, ACCOUNT_GLOBEX],
  // Every combination of the checkout step one purchase controls, in one picker.
  'purchase-controls': [
    ACCOUNT_STARK, // poRequired false, poAttachmentRequired false
    ACCOUNT_ACME, // poRequired true,  poAttachmentRequired false
    ACCOUNT_GLOBEX, // poRequired true,  poAttachmentRequired true
    ACCOUNT_OTP, // OTP account type + both controls on
  ],
  // Live Salesforce payload: fields present, values null.
  'sf-nulls': [ACCOUNT_OTP_SF_PARTIAL, ACCOUNT_OTP_SF_HOLD],
  // Same funds as BrightPath. Recheck on Confirm purchase zeros balances (two-buyer race).
  race: [ACCOUNT_DEMO_BOTH],
};
