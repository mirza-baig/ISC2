import { CartLineItem } from 'types/index';

import { getPrepaidDiscountCentAmount } from './businessReceipt';

jest.mock('providers/index', () => ({}));
jest.mock('hooks/index', () => ({}));

const money = (centAmount: number) => ({
  type: 'centPrecision',
  currencyCode: 'USD',
  centAmount,
  fractionDigits: 2,
});

const lineItem = (unitCentAmount: number, quantity: number, totalCentAmount: number) =>
  ({
    price: { value: money(unitCentAmount) },
    quantity,
    totalPrice: money(totalCentAmount),
  } as unknown as CartLineItem);

describe('getPrepaidDiscountCentAmount', () => {
  it('counts a line whose discount is the prepaid percentage', () => {
    expect(getPrepaidDiscountCentAmount([lineItem(36000, 5, 162000)], 10)).toBe(18000);
  });

  it('skips a line where the contracted discount beat the prepaid percentage', () => {
    expect(getPrepaidDiscountCentAmount([lineItem(20000, 1, 15000)], 10)).toBe(0);
  });

  it('counts only the prepaid lines in a mixed cart', () => {
    expect(
      getPrepaidDiscountCentAmount([lineItem(36000, 1, 32400), lineItem(20000, 1, 15000)], 10)
    ).toBe(3600);
  });

  it('allows a cent of rounding per unit', () => {
    expect(getPrepaidDiscountCentAmount([lineItem(33335, 2, 60001)], 10)).toBe(6669);
  });

  it('ignores lines without a discount', () => {
    expect(getPrepaidDiscountCentAmount([lineItem(36000, 1, 36000)], 10)).toBe(0);
  });
});
