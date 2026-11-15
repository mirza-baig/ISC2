import { useFeatureFlag } from 'providers/featureFlags';

import { hasPrepaidDiscount } from '../cart/useDiscountPercentage';

import usePrepaidCheckoutSummary from './usePrepaidCheckoutSummary';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (factory: () => unknown) => factory(),
}));
jest.mock('providers/featureFlags', () => ({ useFeatureFlag: jest.fn() }));
jest.mock('providers/index', () => ({
  useCart: () => ({ activeCart: { id: 'cart-1', lineItems: [], totalPrice: {} } }),
  useCheckoutProcess: () => ({ selectedPaymentMethod: 'prepaid-account', stepTwoLabels: {} }),
}));
jest.mock('lib/authorizedBuyer', () => ({
  resolvePrepaidDiscount: () => 20,
  buildPrepaidOrderSummary: () => ({
    discountPercent: 20,
    discountAmount: '194.40',
    amountDue: '777.60',
  }),
}));
jest.mock('utils/index', () => ({
  getCartDiscountCentAmount: () => 0,
  getPrepaidDiscountCentAmount: () => 21600,
  parsePrice: (centAmount: number) => (centAmount / 100).toFixed(2),
}));
jest.mock('../cart/useDiscountPercentage', () => ({ hasPrepaidDiscount: jest.fn() }));
jest.mock('./useBusinessPaymentEligibility', () => () => ({
  account: { prepaid: { discountPercentage: 20 } },
  cartTotal: 972,
}));

const mockFlag = useFeatureFlag as jest.Mock;
const mockHasPrepaidDiscount = hasPrepaidDiscount as jest.Mock;

describe('usePrepaidCheckoutSummary', () => {
  it('shows no estimate before the service layer prices the cart when the B2B flag is on', () => {
    mockFlag.mockReturnValue(true);
    mockHasPrepaidDiscount.mockReturnValue(false);

    expect(usePrepaidCheckoutSummary()).toBeNull();
  });

  it('shows the discount the service layer applied when the B2B flag is on', () => {
    mockFlag.mockReturnValue(true);
    mockHasPrepaidDiscount.mockReturnValue(true);

    expect(usePrepaidCheckoutSummary()).toEqual({
      title: 'Discount (20%)',
      discountAmount: '216.00',
      isOnCart: true,
    });
  });

  it('keeps the estimate when the B2B flag is off', () => {
    mockFlag.mockReturnValue(false);
    mockHasPrepaidDiscount.mockReturnValue(false);

    expect(usePrepaidCheckoutSummary()).toEqual({
      title: 'Discount (20%)',
      discountAmount: '194.40',
      total: '777.60',
      isOnCart: false,
    });
  });
});
