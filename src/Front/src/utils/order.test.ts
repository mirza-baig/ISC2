import { isBusinessCheckoutOrder } from './order';

const fields = (...entries: Array<[string, string]>) => ({
  custom: {
    customFieldsRaw: entries.map(([name, value]) => ({ name, value })),
  },
});

describe('isBusinessCheckoutOrder', () => {
  it('is true for an organization checkout order', () => {
    expect(
      isBusinessCheckoutOrder(
        fields(
          ['organization', 'Test SP B2B account'],
          ['authorized-buyer-account-id', '001jI000000DaSUQA0']
        )
      )
    ).toBe(true);
  });

  it('is true when only the shopper context type is organization', () => {
    expect(isBusinessCheckoutOrder(fields(['shopperContextType', 'organization']))).toBe(true);
  });

  it('is false for an individual order', () => {
    expect(isBusinessCheckoutOrder(fields(['tempOrderNumber', '142026100541128494']))).toBe(false);
    expect(isBusinessCheckoutOrder(null)).toBe(false);
  });

  it('keeps CPQ orders on the individual confirmation', () => {
    expect(
      isBusinessCheckoutOrder(fields(['cartType', 'CPQ'], ['organization', 'Acme Corp']))
    ).toBe(false);
  });
});
