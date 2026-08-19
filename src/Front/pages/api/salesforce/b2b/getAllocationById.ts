import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function getAllocationById(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { allocationId } = req.query;

  if (!allocationId) {
    return res.status(500).send({ error: 'No allocation ID is provided' });
  }

  try {
    const response = await fetch(
      `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/b2b/allocations/${allocationId}`,
      {
        method: 'GET',
        headers: {
          client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
          client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data?.error) {
      console.error(
        'Error while fetching allocation by id',
        data.error || data.message || data.Description
      );
      throw 'Error while fetching allocation by id. See server logs for more information.';
    }

    return res.status(200).send(data || {});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
