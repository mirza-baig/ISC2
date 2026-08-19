import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function addAllocationMembers(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { orderNumber, productSku, members } = req.body;

  if (!(productSku && orderNumber && members)) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(`${process.env.SALESFORCE_CLOUDHUB_URL}/v1/b2b/allocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
        client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
      },
      body: JSON.stringify({
        externalID,
        email,
        orderNumber,
        productSku,
        members,
      }),
    });
    const data = await response.json();
    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send({ error });
  }
}
