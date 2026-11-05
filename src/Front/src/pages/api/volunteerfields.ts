import type { NextApiRequest, NextApiResponse } from 'next';
import config from 'temp/config';
import axios from 'axios';
import { getVolunteerPageFields } from 'queries/volunteerSettings';
import { setAPIRouteHeaders } from 'utils/apiUtils';

const volunteerFields = async (_req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  try {
    const requestQuery = _req.query;
    console.log(requestQuery);
    const key = _req.query.pagepath as string;
    const axiosResult = await axios.post(
      config.graphQLEndpoint,
      {
        query: getVolunteerPageFields(key),
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
  } catch (err) {
    return res.status(500).send(err);
  }
};

export default volunteerFields;
