import type { NextApiRequest, NextApiResponse } from 'next';

import getAccountData from '../../pages/api/salesforce/user/getAccountData';
import getSubscriptions from '../../pages/api/salesforce/user/getSubscriptions';
import getUserPicture from '../../pages/api/salesforce/user/getUserPicture';
import deleteUserPicture from '../../pages/api/salesforce/user/deleteUserPicture';
import updateUserPicture from '../../pages/api/salesforce/user/updateUserPicture';
import getLearningJourney from '../../pages/api/salesforce/user/getLearningJourney';
import updateCommunicationPreferences from '../../pages/api/salesforce/user/updateCommunicationPreferences';
import updateUserData from '../../pages/api/salesforce/user/updateUserData';
import uploadOrderFiles from '../../pages/api/salesforce/b2b/uploadOrderFiles';
import { fetchAccountDataFromMulesoft, validateApiRequest } from 'utils/index';

jest.mock('utils/index', () => ({
  setAPIRouteHeaders: jest.fn(),
  validateApiRequest: jest.fn(),
  fetchAccountDataFromMulesoft: jest.fn(),
}));

const mockValidate = validateApiRequest as jest.Mock;
const mockFetchAccountData = fetchAccountDataFromMulesoft as jest.Mock;
const mockFetch = jest.fn();

const SESSION = { externalID: 'session-user-id', email: 'session@example.com' };
const ATTACKER = { externalID: 'victim-user-id', email: 'victim@example.com' };

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;

type Case = {
  name: string;
  handler: Handler;
  method: string;
  body?: Record<string, unknown>;
};

const cases: Case[] = [
  { name: 'getSubscriptions', handler: getSubscriptions, method: 'GET' },
  { name: 'getUserPicture', handler: getUserPicture, method: 'GET' },
  { name: 'deleteUserPicture', handler: deleteUserPicture, method: 'DELETE' },
  {
    name: 'updateUserPicture',
    handler: updateUserPicture,
    method: 'PUT',
    body: { pictureData: { base64: 'abc' } },
  },
  { name: 'getLearningJourney', handler: getLearningJourney, method: 'GET' },
  {
    name: 'updateCommunicationPreferences',
    handler: updateCommunicationPreferences,
    method: 'POST',
    body: { memberOffers: true },
  },
  {
    name: 'uploadOrderFiles',
    handler: uploadOrderFiles,
    method: 'POST',
    body: { orderNumber: '12345', files: [{ filename: 'po.pdf', data: 'QUJD' }] },
  },
];

const makeRes = () => {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const makeReq = (method: string, body?: Record<string, unknown>, withClientIdentity = false) =>
  ({
    method,
    query: withClientIdentity ? { ...ATTACKER } : {},
    body: withClientIdentity ? { ...(body ?? {}), ...ATTACKER } : body ?? {},
    headers: {},
  } as unknown as NextApiRequest);

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => null },
    json: async () => ({}),
    text: async () => '',
  });
  global.fetch = mockFetch as unknown as typeof fetch;
  process.env.SALESFORCE_CLOUDHUB_URL = 'https://mule.example.com';
});

describe('session identity on salesforce api routes', () => {
  describe.each(cases)('$name', ({ handler, method, body }) => {
    it('returns without calling Mulesoft when there is no session', async () => {
      mockValidate.mockResolvedValue(null);
      const res = makeRes();

      await handler(makeReq(method, body), res as unknown as NextApiResponse);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('ignores client supplied identity and uses the session identity', async () => {
      mockValidate.mockResolvedValue(SESSION);
      const res = makeRes();

      await handler(makeReq(method, body, true), res as unknown as NextApiResponse);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = decodeURIComponent(String(mockFetch.mock.calls[0][0]));
      expect(url).toContain(SESSION.externalID);
      expect(url).toContain(SESSION.email);
      expect(url).not.toContain(ATTACKER.externalID);
      expect(url).not.toContain(ATTACKER.email);
    });
  });

  describe('getAccountData', () => {
    it('returns without calling Mulesoft when there is no session', async () => {
      mockValidate.mockResolvedValue(null);

      await getAccountData(makeReq('GET'), makeRes() as unknown as NextApiResponse);

      expect(mockFetchAccountData).not.toHaveBeenCalled();
    });

    it('ignores client supplied identity and uses the session identity', async () => {
      mockValidate.mockResolvedValue(SESSION);
      mockFetchAccountData.mockResolvedValue({});

      await getAccountData(
        makeReq('GET', undefined, true),
        makeRes() as unknown as NextApiResponse
      );

      expect(mockFetchAccountData).toHaveBeenCalledWith(SESSION.externalID, SESSION.email);
    });

    it('returns only the allowed account fields', async () => {
      mockValidate.mockResolvedValue(SESSION);
      mockFetchAccountData.mockResolvedValue({
        message: 'ok',
        data: {
          salesforceGetAccountData: {
            communicationPreferences: { memberOffers: true },
            PreferredLanguage: 'en',
            boardElectionEligible: false,
            bodNominationAccess: true,
            accountContactRelations: [{ id: 'acr-1' }],
            ssn: '123-45-6789',
            phone: '555-0100',
            mailingAddress: { street: '1 Main St' },
          },
        },
      });
      const res = makeRes();

      await getAccountData(makeReq('GET'), res as unknown as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        data: {
          salesforceGetAccountData: {
            communicationPreferences: { memberOffers: true },
            PreferredLanguage: 'en',
            boardElectionEligible: false,
            bodNominationAccess: true,
            accountContactRelations: [{ id: 'acr-1' }],
          },
        },
      });
    });

    it('omits allowed fields that are not present', async () => {
      mockValidate.mockResolvedValue(SESSION);
      mockFetchAccountData.mockResolvedValue({
        data: { salesforceGetAccountData: { PreferredLanguage: 'fr', ssn: '123' } },
      });
      const res = makeRes();

      await getAccountData(makeReq('GET'), res as unknown as NextApiResponse);

      expect(res.send).toHaveBeenCalledWith({
        data: { salesforceGetAccountData: { PreferredLanguage: 'fr' } },
      });
    });

    it('returns empty data when the account data is missing', async () => {
      mockValidate.mockResolvedValue(SESSION);
      mockFetchAccountData.mockResolvedValue({ message: 'ok', phone: '555-0100' });
      const res = makeRes();

      await getAccountData(makeReq('GET'), res as unknown as NextApiResponse);

      expect(res.send).toHaveBeenCalledWith({ data: {} });
    });
  });

  describe('updateUserData', () => {
    it('returns without calling Mulesoft when there is no session', async () => {
      mockValidate.mockResolvedValue(null);

      await updateUserData(
        makeReq('POST', { userData: { firstName: 'Ann' } }),
        makeRes() as unknown as NextApiResponse
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('ignores client supplied externalId and email and sends the session identity', async () => {
      mockValidate.mockResolvedValue(SESSION);
      mockFetch.mockResolvedValue({ json: async () => ({ ok: true }) });

      await updateUserData(
        makeReq('POST', {
          userData: {
            externalId: ATTACKER.externalID,
            email: ATTACKER.email,
            firstName: 'Ann',
          },
        }),
        makeRes() as unknown as NextApiResponse
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload).toEqual({
        userData: {
          externalId: SESSION.externalID,
          email: SESSION.email,
          firstName: 'Ann',
        },
      });
    });
  });
});
