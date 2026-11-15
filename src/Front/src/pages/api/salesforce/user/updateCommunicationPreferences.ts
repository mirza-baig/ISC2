import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);
  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const preferences = req.body;

  try {
    const response = await fetch(
      `${
        process.env.SALESFORCE_CLOUDHUB_URL
      }/v1/user/communicationPreferences?externalID=${encodeURIComponent(
        externalID
      )}&email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
          client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
        },
        body: JSON.stringify(preferences),
      }
    );

    const data = await response.json();

    if (!response.ok || data?.error) {
      console.error(
        'Error while updating communication preferences',
        data.error || data.message || data.Description
      );
      throw 'Error while updating communication preferences. See server logs for more information.';
    }

    return res.status(200).send(data || {});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
