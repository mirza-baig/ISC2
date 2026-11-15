import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';

import { validateApiRequest } from '../../utils/validateApiRequest';

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('../../pages/api/auth/[...nextauth]', () => ({ authOptions: jest.fn(() => ({})) }));

const mockGetServerSession = getServerSession as jest.Mock;
const ORIGINAL_ENV = process.env;

const makeRes = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const makeReq = (headers: Record<string, string> = {}, query: Record<string, string> = {}) =>
  ({
    method: 'GET',
    url: '/api/salesforce/user/getAccountData',
    headers,
    query,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as NextApiRequest);

const sessionWith = (custom_attributes: Record<string, string>) => ({
  user: { custom_attributes },
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.PUBLIC_URL;
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  process.env = ORIGINAL_ENV;
});

describe('validateApiRequest', () => {
  it('returns 401 and null when there is no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = makeRes();

    const result = await validateApiRequest(makeReq(), res as unknown as NextApiResponse);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  it.each([
    ['user_id', { email: 'a@example.com' }],
    ['email', { user_id: 'user-1' }],
  ])('returns 403 and null when the session is missing %s', async (_name, attributes) => {
    mockGetServerSession.mockResolvedValue(sessionWith(attributes));
    const res = makeRes();

    const result = await validateApiRequest(makeReq(), res as unknown as NextApiResponse);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 without reading the session when the origin does not match', async () => {
    process.env.PUBLIC_URL = 'https://www.example.com';
    const res = makeRes();

    const result = await validateApiRequest(
      makeReq({ origin: 'https://evil.example.org' }),
      res as unknown as NextApiResponse
    );

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockGetServerSession).not.toHaveBeenCalled();
  });

  it('accepts a matching origin', async () => {
    process.env.PUBLIC_URL = 'https://www.example.com/';
    mockGetServerSession.mockResolvedValue(
      sessionWith({ user_id: 'user-1', email: 'a@example.com' })
    );

    const result = await validateApiRequest(
      makeReq({ origin: 'https://www.example.com' }),
      makeRes() as unknown as NextApiResponse
    );

    expect(result).toEqual({ externalID: 'user-1', email: 'a@example.com' });
  });

  it('returns the identity from the session custom attributes', async () => {
    mockGetServerSession.mockResolvedValue(
      sessionWith({ user_id: 'user-1', email: 'a@example.com' })
    );

    const result = await validateApiRequest(makeReq(), makeRes() as unknown as NextApiResponse);

    expect(result).toEqual({ externalID: 'user-1', email: 'a@example.com' });
  });

  it('falls back to email_address when email is absent', async () => {
    mockGetServerSession.mockResolvedValue(
      sessionWith({ user_id: 'user-1', email_address: 'b@example.com' })
    );

    const result = await validateApiRequest(makeReq(), makeRes() as unknown as NextApiResponse);

    expect(result).toEqual({ externalID: 'user-1', email: 'b@example.com' });
  });

  it('ignores externalID and email supplied in the query string', async () => {
    mockGetServerSession.mockResolvedValue(
      sessionWith({ user_id: 'user-1', email: 'a@example.com' })
    );

    const result = await validateApiRequest(
      makeReq({}, { externalID: 'victim-id', email: 'victim@example.com' }),
      makeRes() as unknown as NextApiResponse
    );

    expect(result).toEqual({ externalID: 'user-1', email: 'a@example.com' });
  });
});

describe('validateApiRequest cache headers', () => {
  it('sets private, no-store for an authenticated request', async () => {
    mockGetServerSession.mockResolvedValue(sessionWith({ user_id: 'u1', email: 'a@b.com' }));
    const res = makeRes();

    const result = await validateApiRequest(makeReq(), res as unknown as NextApiResponse);

    expect(result).toEqual({ externalID: 'u1', email: 'a@b.com' });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  });

  it('sets private, no-store for an unauthenticated request', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = makeRes();

    const result = await validateApiRequest(makeReq(), res as unknown as NextApiResponse);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  });
});
