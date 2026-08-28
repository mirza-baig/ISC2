import {
  mapAccountContactRelationsToAccounts,
  mergeLiveAndMockAccounts,
} from './mapFromAccountContactRelations';
import type { AuthorizedBuyerAccount } from './types';

const liveOtp = {
  accountId: '001Ek000027iJTJIA2',
  accountName: 'Test OTP Business Account',
  accountType: 'OTP',
  currency: 'USD',
  creditHold: false,
  purchaseControls: { prepaidAuthorized: null, poRequired: true },
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
    discountPercentage: 10,
  },
};

describe('mapAccountContactRelationsToAccounts', () => {
  it('maps live OTP relations and keeps prepaidAuthorized null', () => {
    const [account] = mapAccountContactRelationsToAccounts([liveOtp]);

    expect(account.accountName).toBe('Test OTP Business Account');
    expect(account.purchaseControls.prepaidAuthorized).toBeNull();
    expect(account.prepaid?.balance).toBe(15000);
    expect(account.prepaid?.discountPercentage).toBe(10);
    expect(account.credit.creditLimit).toBe(25000);
    expect(account.creditHold).toBe(false);
  });

  it('skips relations without an id or name', () => {
    expect(
      mapAccountContactRelationsToAccounts([{ accountId: '001', accountName: '' }, {}])
    ).toEqual([]);
  });

  it('prefers ISO country codes and nested creditHold from live Mule payloads', () => {
    const [account] = mapAccountContactRelationsToAccounts([
      {
        accountId: '001Ek000027iJTJIA2',
        accountName: 'Test OTP Business Account',
        credit: { creditHold: true, paymentTerms: 'Net 60' },
        shippingAddress: {
          street: '1 King Street',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'United Kingdom',
          countryCode: 'GB',
        },
      },
    ]);

    expect(account.creditHold).toBe(true);
    expect(account.shippingAddress.country).toBe('GB');
    expect(account.shippingAddress.line1).toBe('1 King Street');
  });
});

describe('mergeLiveAndMockAccounts', () => {
  const mock: AuthorizedBuyerAccount = {
    accountId: 'org-demo-both',
    accountName: 'BrightPath Training Inc',
    accountType: 'B2B',
    currency: 'USD',
    pricingTier: 'ENTERPRISE_1',
    creditHold: false,
    taxExempt: false,
    shippingAddress: {
      line1: '10 Lake Shore Dr',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    },
    purchaseControls: {
      poRequired: false,
      poAttachmentRequired: false,
      prepaidAuthorized: true,
    },
    credit: {
      paymentTerms: 'NET_30',
      creditLimit: 40000,
      creditBalance: 0,
      availableCredit: 40000,
    },
  };

  it('puts live orgs first and keeps mocks', () => {
    const live = mapAccountContactRelationsToAccounts([liveOtp]);
    const merged = mergeLiveAndMockAccounts(live, [mock]);

    expect(merged.map((account) => account.accountName)).toEqual([
      'Test OTP Business Account',
      'BrightPath Training Inc',
    ]);
  });
});
