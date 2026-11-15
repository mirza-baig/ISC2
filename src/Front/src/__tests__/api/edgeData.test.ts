import { getToken } from 'next-auth/jwt';

import edge from '../../pages/api/edge/data';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

const mockGetToken = getToken as jest.Mock;

const mockFetch = jest.fn();

const makeRequest = (query: string, variables: Record<string, unknown> = {}) =>
  new Request('http://localhost/api/edge/data', {
    method: 'POST',
    headers: { 'authorization-isc2': 'access', 'refresh-token-isc2': 'refresh' },
    body: JSON.stringify({ query, variables }),
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue(null);
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({ json: async () => ({ data: {} }) });
  process.env.SERVICE_LAYER_ENDPOINT = 'https://service-layer.example.com';
  process.env.APIM_SUBSCRIPTION_KEY = 'apim-key';
  process.env.NEXTAUTH_SECRET = 'secret';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS;
});

describe('edge/data', () => {
  it('returns 404 when edge functions are not enabled', async () => {
    const response = await edge(makeRequest('GET_ACTIVE_CART'));

    expect(response.status).toBe(404);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 404 when the flag is set to something other than true', async () => {
    process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS = 'false';

    const response = await edge(makeRequest('GET_ACTIVE_CART'));

    expect(response.status).toBe(404);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects queries that are not in the allowlist when enabled', async () => {
    process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS = 'true';

    const response = await edge(makeRequest('{ anything }'));

    expect(response.status).toBe(404);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 401 for identity queries without a session when enabled', async () => {
    process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS = 'true';

    const response = await edge(
      makeRequest('GET_ALL_ORDERS', { externalId: 'victim', email: 'victim@example.com' })
    );

    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('overrides client supplied identity with the session identity', async () => {
    process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS = 'true';
    mockGetToken.mockResolvedValue({
      profile: { custom_attributes: { user_id: 'me', email_address: 'me@example.com' } },
    });

    const response = await edge(
      makeRequest('GET_ALL_ORDERS', { externalId: 'victim', email: 'victim@example.com' })
    );

    expect(response.status).toBe(200);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ externalId: 'me', email: 'me@example.com' });
  });

  it('forwards allowlisted non identity queries when enabled', async () => {
    process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS = 'true';

    const response = await edge(makeRequest('GET_ACTIVE_CART', { cartId: 'c-1' }));

    expect(response.status).toBe(200);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ cartId: 'c-1' });
    expect(typeof body.query).toBe('string');
  });
});
