import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders } from 'utils/index';

export default async function getAllCountries(_req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET');

  try {
    const response = await fetch(`${process.env.SALESFORCE_CLOUDHUB_URL}/v1/allCountries`, {
      method: 'GET',
      headers: {
        client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
        client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
      },
    });

    const data = await response.json();

    if (!response.ok || data?.error) {
      console.error(
        'Error while fetching countries list',
        data.error || data.message || data.Description
      );
      throw 'Error while fetching countries list. See server logs for more information.';
    }

    return res.status(200).send(data.data?.salesforceGetAllCountries || []);
  } catch (error) {
    return res.status(500).send({ error });
  }
}
