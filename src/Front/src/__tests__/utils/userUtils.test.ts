import { getLoggedInUserSalesforceData } from 'utils/userUtils';
import { getServiceLayerAPI } from 'utils/getServiceLayerAPI';

jest.mock('utils/getServiceLayerAPI', () => ({
  getServiceLayerAPI: jest.fn(),
}));

const mockGetServiceLayerAPI = getServiceLayerAPI as jest.Mock;

const account = { firstName: 'Ada', lastName: 'Lovelace' };

describe('getLoggedInUserSalesforceData', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses the api it is given and does not build the default one', async () => {
    const api = {
      post: jest.fn().mockResolvedValue({ data: { data: { salesforceGetAccountData: account } } }),
    };

    const result = await getLoggedInUserSalesforceData({
      externalID: 'ext-1',
      email: 'ada@example.com',
      sync: true,
      api,
    });

    expect(mockGetServiceLayerAPI).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('', {
      query: 'GET_PARTIAL_USER_ACCOUNT',
      variables: { externalId: 'ext-1', email: 'ada@example.com', syncAccountData: true },
    });
    expect(result).toMatchObject({ ...account, fullName: 'Ada Lovelace' });
  });

  it('falls back to the default service layer api', async () => {
    const api = {
      post: jest.fn().mockResolvedValue({ data: { data: { salesforceGetAccountData: account } } }),
    };
    mockGetServiceLayerAPI.mockResolvedValue(api);

    await getLoggedInUserSalesforceData({ sync: false });

    expect(mockGetServiceLayerAPI).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('', {
      query: 'GET_PARTIAL_USER_ACCOUNT',
      variables: { syncAccountData: false },
    });
  });

  it('rejects when a provided api has no externalID', async () => {
    const api = { post: jest.fn() };

    await expect(
      getLoggedInUserSalesforceData({ email: 'ada@example.com', sync: true, api })
    ).rejects.toMatch(/externalID can't be null/);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rejects when a provided api has no email', async () => {
    const api = { post: jest.fn() };

    await expect(
      getLoggedInUserSalesforceData({ externalID: 'ext-1', sync: true, api })
    ).rejects.toMatch(/email can't be null/);
    expect(api.post).not.toHaveBeenCalled();
  });
});
