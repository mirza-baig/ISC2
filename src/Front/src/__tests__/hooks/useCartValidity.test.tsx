/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import useCartValidity from 'hooks/cart/useCartValidity';

let mockIsB2BFeatureEnabled = false;
let mockActiveCart: Record<string, unknown>;

jest.mock('providers/index', () => ({
  useCart: () => ({
    activeCart: mockActiveCart,
    getCartSuccess: true,
    isIdURLParamDefined: false,
  }),
}));
jest.mock('providers/featureFlags', () => ({
  useFeatureFlag: () => mockIsB2BFeatureEnabled,
}));
jest.mock('hooks/index', () => ({
  useLoggedUser: () => ({ user: { email: 'buyer@example.com' } }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const buildCart = (overrides: Record<string, unknown> = {}) => ({
  id: 'cart-1',
  cartState: 'Active',
  customerEmail: 'buyer@example.com',
  taxedPrice: null,
  computed: { isB2B: true },
  ...overrides,
});

let container: HTMLDivElement;
let root: Root;
let cartError: ReturnType<typeof useCartValidity>['cartError'];

const Harness = ({ isCheckout }: { isCheckout: boolean }) => {
  cartError = useCartValidity({ isCheckout }).cartError;
  return null;
};

const renderValidity = (isCheckout: boolean) => {
  act(() => {
    root.render(<Harness isCheckout={isCheckout} />);
  });
  return cartError;
};

describe('useCartValidity', () => {
  beforeEach(() => {
    mockActiveCart = buildCart();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('flags an untaxed CPQ cart at checkout when the B2B flag is off', () => {
    mockIsB2BFeatureEnabled = false;

    expect(renderValidity(true)).toEqual([{ message: 'CART_INFO_INCOMPLETE' }]);
  });

  it('does not flag an untaxed CPQ cart when the B2B flag is on', () => {
    mockIsB2BFeatureEnabled = true;

    expect(renderValidity(true)).toBeNull();
  });

  it('does not flag an untaxed CPQ cart outside checkout', () => {
    mockIsB2BFeatureEnabled = false;

    expect(renderValidity(false)).toBeNull();
  });

  it('does not flag a taxed CPQ cart when the B2B flag is off', () => {
    mockIsB2BFeatureEnabled = false;
    mockActiveCart = buildCart({ taxedPrice: { totalGross: { centAmount: 100 } } });

    expect(renderValidity(true)).toBeNull();
  });

  it('does not flag a non-CPQ cart when the B2B flag is off', () => {
    mockIsB2BFeatureEnabled = false;
    mockActiveCart = buildCart({ computed: { isB2B: false } });

    expect(renderValidity(true)).toBeNull();
  });
});
