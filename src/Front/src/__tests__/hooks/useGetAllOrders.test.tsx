/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import useGetAllOrders from 'hooks/order/useGetAllOrders';
import { SERVICE_LAYER_QUERIES } from 'lib/service-layer-queries';

let mockIsB2BFeatureEnabled = false;
let mockQueryFn: () => Promise<{ orders: unknown[] }>;
const mockPost = jest.fn();
const mockNormalize = jest.fn((order: unknown) => order);
const mockCollapse = jest.fn((orders: unknown[]) => orders);

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryFn: () => Promise<{ orders: unknown[] }> }) => {
    mockQueryFn = options.queryFn;
    return { data: undefined, isLoading: false, error: null };
  },
}));
jest.mock('providers/featureFlags', () => ({
  useFeatureFlag: () => mockIsB2BFeatureEnabled,
}));
jest.mock('hooks/index', () => ({
  useLoggedUser: () => ({ externalID: 'ext-1', email: 'buyer@example.com' }),
}));
jest.mock('utils/index', () => ({
  getServiceLayerAPI: async () => ({ post: mockPost }),
  normalizePrintableOrder: (order: unknown) => mockNormalize(order),
  collapseSalesforceOrderShells: (orders: unknown[]) => mockCollapse(orders),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const B2B_FIELDS = ['organization', 'buyer', 'poNumber', 'customerOrderReference'];
const rawOrder = { orderId: 'o-1', products: [{ productQuantity: 2 }] };

let container: HTMLDivElement;
let root: Root;

const Harness = () => {
  useGetAllOrders();
  return null;
};

const renderHarness = () => {
  act(() => {
    root.render(<Harness />);
  });
};

describe('order history queries', () => {
  it('requests the B2B order fields only in GET_ALL_ORDERS', () => {
    B2B_FIELDS.forEach((field) => {
      expect(SERVICE_LAYER_QUERIES.GET_ALL_ORDERS).toMatch(new RegExp(`\\b${field}\\b`));
      expect(SERVICE_LAYER_QUERIES.GET_ALL_ORDERS_WITHOUT_B2B_FIELDS).not.toMatch(
        new RegExp(`\\b${field}\\b`)
      );
    });
  });

  it('keeps the shared order fields in both queries', () => {
    ['orderId', 'orderNumber', 'paymentType', 'orderReferenceNumber', 'productQuantity'].forEach(
      (field) => {
        expect(SERVICE_LAYER_QUERIES.GET_ALL_ORDERS).toContain(field);
        expect(SERVICE_LAYER_QUERIES.GET_ALL_ORDERS_WITHOUT_B2B_FIELDS).toContain(field);
      }
    );
  });
});

describe('useGetAllOrders', () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockPost.mockResolvedValue({ data: { data: { salesforceGetOrders: [rawOrder] } } });
    mockNormalize.mockClear();
    mockCollapse.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('uses the query without B2B fields and returns raw orders when the B2B flag is off', async () => {
    mockIsB2BFeatureEnabled = false;
    renderHarness();

    const result = await mockQueryFn();

    expect(mockPost).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ query: 'GET_ALL_ORDERS_WITHOUT_B2B_FIELDS' })
    );
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(mockCollapse).not.toHaveBeenCalled();
    expect(result.orders).toEqual([rawOrder]);
  });

  it('uses the B2B query and normalises orders when the B2B flag is on', async () => {
    mockIsB2BFeatureEnabled = true;
    renderHarness();

    await mockQueryFn();

    expect(mockPost).toHaveBeenCalledWith('', expect.objectContaining({ query: 'GET_ALL_ORDERS' }));
    expect(mockNormalize).toHaveBeenCalledTimes(1);
    expect(mockCollapse).toHaveBeenCalledTimes(1);
  });
});
