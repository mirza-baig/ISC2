import axios from 'axios';

import { AUTHORIZATION_TOKEN, REFRESH_TOKEN, APIM_SUBSCRIPTION_KEY } from 'constants/index';
import { SERVICE_LAYER_QUERIES } from 'lib/service-layer-queries';
import { SERVICE_LAYER_AUTH } from 'lib/service-layer-queries/auth';

type ServerServiceLayerBody = {
  query: keyof typeof SERVICE_LAYER_QUERIES;
  variables?: Record<string, unknown>;
};

const getConfig = () => {
  const endpoint = process.env.SERVICE_LAYER_ENDPOINT;
  const apimSubscriptionKey = process.env.APIM_SUBSCRIPTION_KEY;

  if (!endpoint || !apimSubscriptionKey) {
    throw new Error('Service layer is not configured');
  }

  return { endpoint, apimSubscriptionKey };
};

const getAnonymousTokens = async (endpoint: string, apimSubscriptionKey: string) => {
  const { data } = await axios.post(
    endpoint,
    { query: SERVICE_LAYER_AUTH },
    {
      headers: {
        'Content-Type': 'application/json',
        [APIM_SUBSCRIPTION_KEY]: apimSubscriptionKey,
      },
    }
  );

  const token = data?.data?.obtainAnonymousToken;

  if (!token?.access_token || !token?.refresh_token) {
    throw new Error('Error while requesting token from service layer');
  }

  return { accessToken: token.access_token, refreshToken: token.refresh_token };
};

export const createServerServiceLayerAPI = () => ({
  post: async (_url: string, { query, variables }: ServerServiceLayerBody) => {
    const { endpoint, apimSubscriptionKey } = getConfig();

    const graphqlQuery = SERVICE_LAYER_QUERIES[query];

    if (!graphqlQuery) {
      throw new Error(`Unknown service layer query: ${query}`);
    }

    const { accessToken, refreshToken } = await getAnonymousTokens(endpoint, apimSubscriptionKey);

    const { data } = await axios.post(
      endpoint,
      { query: graphqlQuery, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          [AUTHORIZATION_TOKEN]: accessToken,
          [REFRESH_TOKEN]: refreshToken,
          [APIM_SUBSCRIPTION_KEY]: apimSubscriptionKey,
        },
      }
    );

    return { data };
  },
});
