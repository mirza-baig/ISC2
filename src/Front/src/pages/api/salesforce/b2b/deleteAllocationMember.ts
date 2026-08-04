import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function deleteAllocationMember(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'DELETE', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { orderNumber, productSku, memberToDelete } = req.body;

  if (!(productSku && orderNumber && memberToDelete)) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(
      `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/b2b/allocations/order`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
          client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
        },
        body: JSON.stringify({
          externalID,
          email,
          memberToDelete,
          orderNumber,
          productSku,
        }),
      }
    );
    const data = await response.json();
    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send({ error });
  }
}
