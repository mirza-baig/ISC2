import { EXTERNAL_MULESOFT_PROFILE_PICTURE_URL } from 'constants/index';
import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders } from 'utils/index';

export default async function getUserPicture(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET');

  const { externalID, email } = req.query;

  if (!externalID || !email) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(
      `${EXTERNAL_MULESOFT_PROFILE_PICTURE_URL}?externalID=${externalID}&email=${email}`,
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
        'Error while fetching user picture',
        data.error || data.message || data.Description
      );
      throw 'Error while fetching user picture. See server logs for more information.';
    }

    return res.status(200).send(data || {});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
