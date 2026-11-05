/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import useGetPaymentIntent from 'hooks/checkout/useGetPaymentIntent';

type MutationOptions = {
  mutationFn: (payload: { cart: Record<string, unknown> }) => Promise<unknown>;
};

let mockIsB2BFeatureEnabled = false;
let mockMutationData: Record<string, unknown> | undefined;
let mockMutationOptions: MutationOptions;
const mockPost = jest.fn();
const mockSetErrorState = jest.fn();

jest.mock('providers/featureFlags', () => ({
  useFeatureFlag: () => mockIsB2BFeatureEnabled,
}));
jest.mock('providers/index', () => ({
  useCart: () => ({ isFreeOrder: false }),
  useCheckoutProcess: () => ({ setErrorState: mockSetErrorState }),
}));
jest.mock('hooks/index', () => ({
  useCustomMutation: (options: MutationOptions) => {
    mockMutationOptions = options;
    return {
      isPending: false,
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      data: mockMutationData,
      error: null,
    };
  },
}));
jest.mock('utils/getServiceLayerAPI', () => ({
  getServiceLayerAPI: async () => ({ post: mockPost }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const usdCart = { id: 'cart-1', version: 1, totalPrice: { currencyCode: 'USD', centAmount: 100 } };

let container: HTMLDivElement;
let root: Root;

const Harness = () => {
  useGetPaymentIntent();
  return null;
};

const renderHarness = () => {
  act(() => {
    root.render(<Harness />);
  });
};

describe('useGetPaymentIntent', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockPost.mockReset();
    mockSetErrorState.mockReset();
    mockMutationData = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  describe('mutationFn with an empty payment intent and GraphQL errors', () => {
    beforeEach(() => {
      mockPost.mockResolvedValue({
        data: { data: { isc2CreatePaymentIntent: null }, errors: [{ message: 'boom' }] },
      });
    });

    it('rejects when the B2B flag is on', async () => {
      mockIsB2BFeatureEnabled = true;
      renderHarness();

      await expect(mockMutationOptions.mutationFn({ cart: usdCart })).rejects.toEqual({
        message: 'boom',
      });
    });

    it('resolves with the empty intent when the B2B flag is off', async () => {
      mockIsB2BFeatureEnabled = false;
      renderHarness();

      await expect(mockMutationOptions.mutationFn({ cart: usdCart })).resolves.toBeNull();
    });
  });

  describe('incomplete payment information with an intent id', () => {
    beforeEach(() => {
      mockMutationData = { intentPaymentId: 'pi_123' };
    });

    it('does not set the error state when the B2B flag is on', () => {
      mockIsB2BFeatureEnabled = true;
      renderHarness();

      expect(mockSetErrorState).not.toHaveBeenCalled();
    });

    it('sets the error state when the B2B flag is off', () => {
      mockIsB2BFeatureEnabled = false;
      renderHarness();

      expect(mockSetErrorState).toHaveBeenCalledWith([
        { message: 'PAYMENT_INFORMATION_INCOMPLETE' },
      ]);
    });
  });
});
