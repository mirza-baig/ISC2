import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getToken } from 'next-auth/jwt';

import data from '../../pages/api/services/data';
import { validateApiRequest } from 'utils/validateApiRequest';

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), isAxiosError: jest.fn() },
}));
jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));
jest.mock('utils/apiUtils', () => ({ setAPIRouteHeaders: jest.fn() }));
jest.mock('utils/validateApiRequest', () => ({ validateApiRequest: jest.fn() }));

const mockPost = axios.post as jest.Mock;
const mockValidate = validateApiRequest as jest.Mock;
const mockGetToken = getToken as jest.Mock;

const makeRes = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), send: jest.fn(), end: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const run = async (body: Record<string, unknown>) => {
  const res = makeRes();
  const req = {
    method: 'POST',
    headers: { 'authorization-isc2': 'anon', 'refresh-token-isc2': 'refresh' },
    body,
  } as unknown as NextApiRequest;
  await data(req, res as unknown as NextApiResponse);
  return res;
};

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    SERVICE_LAYER_ENDPOINT: 'https://service-layer.test/graphql',
    APIM_SUBSCRIPTION_KEY: 'key',
  };
  mockGetToken.mockResolvedValue(null);
  mockPost.mockResolvedValue({ status: 200, headers: {}, data: { data: {} } });
});

afterAll(() => {
  process.env = originalEnv;
});

describe('/api/services/data identity-scoped queries', () => {
  it.each([
    'GET_USER_ACCOUNT',
    'GET_PARTIAL_USER_ACCOUNT',
    'GET_ALL_ORDERS',
    'GET_ALL_ORDERS_WITHOUT_B2B_FIELDS',
    'GET_ORDER',
  ])('does not call the service layer for %s without a session', async (query) => {
    mockValidate.mockResolvedValue(null);

    await run({ query, variables: { externalId: 'victim', email: 'victim@example.com' } });

    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('replaces client supplied identity with the session identity', async () => {
    mockValidate.mockResolvedValue({ externalID: 'me', email: 'me@example.com' });

    const res = await run({
      query: 'GET_PARTIAL_USER_ACCOUNT',
      variables: { externalId: 'victim', email: 'victim@example.com', orderNumber: '42' },
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][1].variables).toEqual({
      externalId: 'me',
      email: 'me@example.com',
      orderNumber: '42',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('supplies the session identity when the client sent none', async () => {
    mockValidate.mockResolvedValue({ externalID: 'me', email: 'me@example.com' });

    await run({ query: 'GET_ALL_ORDERS' });

    expect(mockPost.mock.calls[0][1].variables).toEqual({
      externalId: 'me',
      email: 'me@example.com',
    });
  });
});

describe('/api/services/data other queries', () => {
  it('does not require a session for GET_CURRENCIES', async () => {
    await run({ query: 'GET_CURRENCIES', variables: { foo: 'bar' } });

    expect(mockValidate).not.toHaveBeenCalled();
    expect(mockPost.mock.calls[0][1].variables).toEqual({ foo: 'bar' });
  });

  it('returns 404 for an unknown query before checking the session', async () => {
    const res = await run({ query: 'NOPE' });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockValidate).not.toHaveBeenCalled();
  });
});
