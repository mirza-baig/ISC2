import type { NextApiRequest, NextApiResponse } from 'next';
import config from 'temp/config';
import axios from 'axios';
import { HEADER_API_CONTENT_FOR_SALESFORCE_PAGE } from 'queries/searchSettings';
import { setAPIRouteHeaders } from 'utils/apiUtils';

const headerApi = async (_req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const axiosResult = await axios.post(
    config.graphQLEndpoint,
    {
      query: HEADER_API_CONTENT_FOR_SALESFORCE_PAGE,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        sc_apikey: config.sitecoreApiKey,
      },
    }
  );
  setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT');
  return res.status(200).send(axiosResult.data);
};

export default headerApi;
