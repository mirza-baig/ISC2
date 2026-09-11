import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAccountDataFromMulesoft, setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;

  try {
    const data = await fetchAccountDataFromMulesoft(externalID, email);

    return res.status(200).send(data || {});
  } catch (error) {
    console.error('Error while fetching account data', error);

    return res.status(500).send({ error: 'Error while fetching account data.' });
  }
}
