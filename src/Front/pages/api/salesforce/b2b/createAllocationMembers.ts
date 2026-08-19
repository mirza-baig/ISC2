import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function createAllocationMembers(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { orderNumber, productSku, members } = req.body;

  if (!(members && orderNumber && productSku)) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(`${process.env.SALESFORCE_CLOUDHUB_URL}/v1/b2b/createInvitees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
        client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
      },
      body: JSON.stringify({
        email,
        externalID,
        orderNumber,
        productSku,
        members,
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.error) {
      console.error(
        'Error while creating allocation members',
        data.error || data.message || data.Description
      );
      throw 'Error while creating allocation members. See server logs for more information.';
    }

    return res.status(200).send(data || {});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
