import { mapAccountContactRelationsToAccounts } from './mapFromAccountContactRelations';

const liveOtp = {
  accountId: '001Ek000027iJTJIA2',
  accountName: 'Test OTP Business Account',
  accountType: 'OTP',
  roles: 'Authorized Buyer',
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
      mapAccountContactRelationsToAccounts([
        { accountId: '001', accountName: '', roles: 'Authorized Buyer' },
        {},
      ])
    ).toEqual([]);
  });

  it('keeps only relations carrying the Authorized Buyer role', () => {
    const accounts = mapAccountContactRelationsToAccounts([
      { accountId: '001', accountName: 'Allocator Only', roles: 'Allocator' },
      { accountId: '002', accountName: 'No Roles At All' },
      { accountId: '003', accountName: 'Mixed Roles', roles: 'Allocator;Authorized Buyer' },
    ]);

    expect(accounts.map((account) => account.accountName)).toEqual(['Mixed Roles']);
  });

  it('prefers ISO country codes and nested creditHold from live Mule payloads', () => {
    const [account] = mapAccountContactRelationsToAccounts([
      {
        accountId: '001Ek000027iJTJIA2',
        accountName: 'Test OTP Business Account',
        roles: 'Authorized Buyer',
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
