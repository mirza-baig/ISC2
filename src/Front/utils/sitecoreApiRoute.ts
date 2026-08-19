import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { type AxiosResponse } from 'axios';

import config from 'temp/config';

const ALLOWED_HEADERS =
  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key';

const isAuthenticated = (req: NextApiRequest): boolean => {
  const apiKey = req.headers['x-api-key'];

  return typeof apiKey === 'string' && apiKey === config.sitecoreApiKey;
};

export const handledApiPreamble = (req: NextApiRequest, res: NextApiResponse): boolean => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.status(200).end();
    return true;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return true;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }

  return false;
};

export const postSitecoreGraphQL = <TResponse>(query: string): Promise<AxiosResponse<TResponse>> =>
  axios.post<TResponse>(
    config.graphQLEndpoint,
    { query },
    {
      headers: {
        'Content-Type': 'application/json',
        sc_apikey: config.sitecoreApiKey,
      },
    }
  );
