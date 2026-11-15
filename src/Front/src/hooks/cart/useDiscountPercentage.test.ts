import { buildPaymentTypeVariables, clearPaymentTypeSelection } from './useDiscountPercentage';

jest.mock('providers/index', () => ({}));
jest.mock('providers/featureFlags', () => ({ useFeatureFlag: jest.fn() }));
jest.mock('utils/index', () => ({ getServiceLayerAPI: jest.fn() }));
jest.mock('./useAuthorizedBuyerPricingVoucher', () => jest.fn());

const PREPAID_DISCOUNT_CART_KEY = 'isc2-prepaid-discount-cart-id';

const store = new Map<string, string>();

Object.defineProperty(global, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  },
});

describe('buildPaymentTypeVariables', () => {
  it('only sends the selected payment type when the B2B flag is on', () => {
    expect(buildPaymentTypeVariables(true, 10, 'prepaid-account')).toEqual({
      actions: [{ recalculate: {} }],
      paymentType: 'prepaid-account',
    });
  });

  it('sends an empty payment type to clear the selection when the B2B flag is on', () => {
    expect(buildPaymentTypeVariables(true, null)).toEqual({
      actions: [{ recalculate: {} }],
      paymentType: '',
    });
  });

  it('keeps sending the direct discount when the B2B flag is off', () => {
    expect(buildPaymentTypeVariables(false, 10)).toEqual({
      actions: [
        {
          setDirectDiscounts: {
            discounts: [
              {
                value: { relative: { permyriad: 1000 } },
                target: { lineItems: { predicate: 'quantity > 0' } },
              },
            ],
          },
        },
      ],
    });
  });
});

describe('clearPaymentTypeSelection', () => {
  afterEach(() => localStorage.clear());

  it('clears the payment type on a cart that has the prepaid discount', () => {
    localStorage.setItem(PREPAID_DISCOUNT_CART_KEY, 'cart-1');

    expect(clearPaymentTypeSelection('cart-1')).toEqual({ paymentType: '' });
  });

  it('sends nothing for a cart without the prepaid discount', () => {
    localStorage.setItem(PREPAID_DISCOUNT_CART_KEY, 'cart-2');

    expect(clearPaymentTypeSelection('cart-1')).toEqual({});
  });
});
