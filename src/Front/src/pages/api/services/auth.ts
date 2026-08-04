import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import { setAPIRouteHeaders } from 'utils/apiUtils';
import { SERVICE_LAYER_AUTH } from 'lib/service-layer-queries/auth';
import { APIM_SUBSCRIPTION_KEY } from 'constants/index';

const auth = async (_req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  setAPIRouteHeaders(res, 'GET');

  if (!process.env.SERVICE_LAYER_ENDPOINT) {
    return res.status(500).send('Invalid GraphQL endpoint');
  }

  const apimSubscriptionKey = process.env.APIM_SUBSCRIPTION_KEY;

  if (!apimSubscriptionKey) {
    return res.status(500).send('Internal server error');
  }

  try {
    console.log('AUTH API: Starting service layer authentication request:', {
      endpoint: process.env.SERVICE_LAYER_ENDPOINT,
      query: SERVICE_LAYER_AUTH,
      timestamp: new Date().toISOString(),
    });

    console.log('AUTH API: Making direct POST request to service layer');
    const axiosResult = await axios.post(
      process.env.SERVICE_LAYER_ENDPOINT!,
      {
        query: SERVICE_LAYER_AUTH,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          [APIM_SUBSCRIPTION_KEY]: apimSubscriptionKey,
        },
      }
    );

    console.log('AUTH API: Service layer request completed successfully:', {
      status: axiosResult.status,
      statusText: axiosResult.statusText,
      hasData: !!axiosResult.data,
      dataKeys: axiosResult.data ? Object.keys(axiosResult.data) : [],
    });

    const { obtainAnonymousToken } = axiosResult?.data?.data;

    if (!obtainAnonymousToken) {
      console.error('AUTH API: Missing obtainAnonymousToken in response:', {
        responseData: axiosResult.data,
        dataData: axiosResult.data?.data,
      });
      return res.status(500).send('Error while requesting token from service layer');
    }

    console.log('AUTH API: Extracting token fields:', {
      hasAccessToken: !!obtainAnonymousToken.access_token,
      hasRefreshToken: !!obtainAnonymousToken.refresh_token,
      hasExpiresIn: !!obtainAnonymousToken.expires_in,
      hasAnonymousId: !!obtainAnonymousToken.anonymousId,
      tokenFields: Object.keys(obtainAnonymousToken),
    });

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      anonymousId,
    } = obtainAnonymousToken;

    console.log('AUTH API: Successfully returning tokens');
    return res.status(200).send({ accessToken, refreshToken, expiresIn, anonymousId });
  } catch (err) {
    console.error('AUTH API: Exception caught during service layer request:', {
      errorType: err?.constructor?.name,
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : 'Unknown',
      code:
        err instanceof Error && 'code' in err ? (err as Error & { code: string }).code : 'Unknown',
      endpoint: process.env.SERVICE_LAYER_ENDPOINT,
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).send(err);
  }
};

export default auth;
