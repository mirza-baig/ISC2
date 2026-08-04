import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import config from 'temp/config';
import { setAPIRouteHeaders } from 'utils/apiUtils';
import { middlewareApiForLayout } from 'queries/searchSettings';

const fetchMiddlewareFields = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  try {
    const requestQuery = req.query;
    const page = requestQuery.page as string;

    const axiosResult = await axios.post(
      config.graphQLEndpoint,
      {
        query: middlewareApiForLayout(page),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          sc_apikey: config.sitecoreApiKey,
        },
      }
    );

    setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT');

    const maxAge = process.env.MIDDLEWARE_FIELDS_CACHE_MAX_AGE || '300';
    const swr = process.env.MIDDLEWARE_FIELDS_CACHE_SWR || '600';
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`);

    return res.status(200).send(axiosResult.data);
  } catch (err) {
    console.error('ERROR DURING fetch REQUEST', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default fetchMiddlewareFields;
