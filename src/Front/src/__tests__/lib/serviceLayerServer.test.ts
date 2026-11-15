import axios from 'axios';

import { createServerServiceLayerAPI } from 'lib/serviceLayerServer';
import { SERVICE_LAYER_QUERIES } from 'lib/service-layer-queries';
import { SERVICE_LAYER_AUTH } from 'lib/service-layer-queries/auth';

jest.mock('axios');

const mockPost = axios.post as jest.Mock;

const tokenResponse = {
  data: { data: { obtainAnonymousToken: { access_token: 'access', refresh_token: 'refresh' } } },
};

describe('createServerServiceLayerAPI', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      SERVICE_LAYER_ENDPOINT: 'https://service-layer.test/graphql',
      APIM_SUBSCRIPTION_KEY: 'apim-key',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('gets an anonymous token then posts the mapped query with APIM and token headers', async () => {
    mockPost
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce({ data: { data: { ok: true } } });

    const result = await createServerServiceLayerAPI().post('', {
      query: 'GET_PARTIAL_USER_ACCOUNT',
      variables: { externalId: 'abc', email: 'a@b.c' },
    });

    expect(result).toEqual({ data: { data: { ok: true } } });
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      'https://service-layer.test/graphql',
      { query: SERVICE_LAYER_AUTH },
      {
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': 'apim-key',
        },
      }
    );
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      'https://service-layer.test/graphql',
      {
        query: SERVICE_LAYER_QUERIES.GET_PARTIAL_USER_ACCOUNT,
        variables: { externalId: 'abc', email: 'a@b.c' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'authorization-isc2': 'access',
          'refresh-token-isc2': 'refresh',
          'Ocp-Apim-Subscription-Key': 'apim-key',
        },
      }
    );
  });

  it('throws on an unknown query without calling the service layer', async () => {
    await expect(
      createServerServiceLayerAPI().post('', {
        query: 'NOT_A_QUERY' as unknown as keyof typeof SERVICE_LAYER_QUERIES,
      })
    ).rejects.toThrow('Unknown service layer query');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws when the endpoint is missing', async () => {
    delete process.env.SERVICE_LAYER_ENDPOINT;

    await expect(
      createServerServiceLayerAPI().post('', { query: 'GET_PARTIAL_USER_ACCOUNT' })
    ).rejects.toThrow('Service layer is not configured');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws when the APIM key is missing', async () => {
    delete process.env.APIM_SUBSCRIPTION_KEY;

    await expect(
      createServerServiceLayerAPI().post('', { query: 'GET_PARTIAL_USER_ACCOUNT' })
    ).rejects.toThrow('Service layer is not configured');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws when no anonymous token is returned', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: {} } });

    await expect(
      createServerServiceLayerAPI().post('', { query: 'GET_PARTIAL_USER_ACCOUNT' })
    ).rejects.toThrow('Error while requesting token');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
