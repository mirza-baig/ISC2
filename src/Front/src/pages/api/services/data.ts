import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getToken } from 'next-auth/jwt';

import { setAPIRouteHeaders } from 'utils/apiUtils';
import {
  AUTHORIZATION_TOKEN,
  REFRESH_TOKEN,
  APIM_SUBSCRIPTION_KEY,
  GENERIC_ERROR_MESSAGE,
} from 'constants/index';
import { SERVICE_LAYER_QUERIES } from 'lib/service-layer-queries';
import { classifyServiceLayerError, ServiceLayerErrorCode } from 'lib/serviceLayerErrors';

const CT_ERROR_PRICE = `${GENERIC_ERROR_MESSAGE} CT_002`;
const CT_ERROR_GENERAL = `${GENERIC_ERROR_MESSAGE} CT_001`;

const sanitizeErrorMessage = (message?: string): string => {
  if (!message) return CT_ERROR_GENERAL;
  if (message === 'invalid_token') return message;
  if (message.includes('does not contain a price')) return CT_ERROR_PRICE;
  return CT_ERROR_GENERAL;
};

const data = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  setAPIRouteHeaders(res, 'POST');

  const { headers, body } = req;
  const { query, variables } = body;

  const authorizationToken = headers[AUTHORIZATION_TOKEN];
  const refreshToken = headers[REFRESH_TOKEN];
  const apimSubscriptionKey = process.env.APIM_SUBSCRIPTION_KEY;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const salesforceAccessToken = token?.accessToken as string | undefined;

  if (!process.env.SERVICE_LAYER_ENDPOINT) {
    return res.status(500).send({ message: 'Invalid GraphQL endpoint' });
  }

  if (!authorizationToken) {
    return res.status(500).send({ message: 'Missing authorization token' });
  }

  if (!refreshToken) {
    return res.status(500).send({ message: 'Missing refresh token' });
  }

  if (!apimSubscriptionKey) {
    return res.status(500).send({ message: 'Internal server error' });
  }

  if (!SERVICE_LAYER_QUERIES[query as keyof typeof SERVICE_LAYER_QUERIES]) {
    return res.status(404).send({ message: 'Invalid query' });
  }

  try {
    const axiosResult = await axios.post(
      process.env.SERVICE_LAYER_ENDPOINT!,
      {
        query: SERVICE_LAYER_QUERIES[query as keyof typeof SERVICE_LAYER_QUERIES],
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          [AUTHORIZATION_TOKEN]: authorizationToken,
          [REFRESH_TOKEN]: refreshToken,
          [APIM_SUBSCRIPTION_KEY]: apimSubscriptionKey,
          ...(salesforceAccessToken && { 'x-salesforce-access-token': salesforceAccessToken }),
        },
      }
    );

    if (axiosResult?.data?.errors?.length) {
      axiosResult.data.errors = axiosResult.data.errors.map(
        (err: {
          message?: string;
          extensions?: { code?: string; [key: string]: unknown };
          [key: string]: unknown;
        }) => {
          const existingCode = err.extensions?.code;
          const code =
            existingCode && existingCode !== 'INTERNAL_SERVER_ERROR'
              ? (existingCode as ServiceLayerErrorCode)
              : classifyServiceLayerError(err.message);
          const errorCorrelationId = err.extensions?.correlationId as string | undefined;

          console.error(
            `[SERVICE_LAYER_ERROR] ${JSON.stringify({
              query,
              correlationId: errorCorrelationId,
              code,
              ...(process.env.NODE_ENV === 'development' && { message: err.message }),
            })}`
          );

          return {
            ...err,
            extensions: {
              ...err.extensions,
              code,
              correlationId: errorCorrelationId,
            },
            message: sanitizeErrorMessage(err.message),
          };
        }
      );
    }

    return res.status(200).send(axiosResult?.data);
  } catch (err) {
    const code = classifyServiceLayerError(err instanceof Error ? err.message : undefined);
    console.error(
      `[SERVICE_LAYER_ERROR] ${JSON.stringify({
        query,
        code,
        ...(process.env.NODE_ENV === 'development' && {
          message: err instanceof Error ? err.message : undefined,
        }),
      })}`
    );

    return res.status(500).send(GENERIC_ERROR_MESSAGE);
  }
};

export default data;
