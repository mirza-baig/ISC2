import { EXTERNAL_MULESOFT_PROFILE_PICTURE_URL } from 'constants/index';
import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function updateUserPicture(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'PUT', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { pictureData } = req.body;

  if (!pictureData) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(
      `${EXTERNAL_MULESOFT_PROFILE_PICTURE_URL}?externalID=${encodeURIComponent(
        externalID
      )}&email=${encodeURIComponent(email)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
          client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
        },
        body: JSON.stringify({
          ...pictureData,
        }),
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Request failed with status ${response.status}` });
    }

    return res.status(200).json({});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
