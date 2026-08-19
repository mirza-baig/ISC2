import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders } from 'utils/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST');
  const { externalID, email } = req.query;
  const preferences = req.body;

  if (!externalID || !email) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(
      `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/user/communicationPreferences?externalID=${externalID}&email=${email}`,
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
