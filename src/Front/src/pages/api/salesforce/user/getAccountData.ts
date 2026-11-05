import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAccountDataFromMulesoft, setAPIRouteHeaders } from 'utils/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET');
  const { externalID, email } = req.query;

  if (!externalID || !email) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const data = await fetchAccountDataFromMulesoft(String(externalID), String(email));

    return res.status(200).send(data || {});
  } catch (error) {
    console.error('Error while fetching account data', error);

    return res.status(500).send({ error: 'Error while fetching account data.' });
  }
}
