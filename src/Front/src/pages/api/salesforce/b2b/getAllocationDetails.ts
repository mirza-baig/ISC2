import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function getAllocationDetails(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { orderNumber, productSku } = req.query;

  if (!(productSku && orderNumber)) {
    return res
      .status(500)
      .send({ error: 'Error while fetching allocation details: no data is provided' });
  }

  try {
    const response = await axios.get(
      `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/b2b/allocations/order`,
      {
        params: { externalID, email, orderNumber, productSku },
        headers: {
          client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
          client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
        },
        validateStatus: () => true,
      }
    );

    const data = response.data;

    if (!(response.status >= 200 && response.status < 300) || data?.error) {
      console.error(
        'Error while fetching allocation details',
        data.error || data.message || data.Description
      );
      throw 'Error while fetching allocation details. See server logs for more information.';
    }

    return res.status(200).send(data || {});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
