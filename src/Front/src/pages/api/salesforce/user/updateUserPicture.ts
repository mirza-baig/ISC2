import { EXTERNAL_MULESOFT_PROFILE_PICTURE_URL } from 'constants/index';
import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders } from 'utils/index';

export default async function updateUserPicture(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'PUT');
  const { body } = req;
  const { externalID, email, pictureData } = body;

  if (!externalID || !email || !pictureData) {
    return res.status(500).send({ error: 'Invalid parameters provided' });
  }

  try {
    const response = await fetch(
      `${EXTERNAL_MULESOFT_PROFILE_PICTURE_URL}?externalID=${externalID}&email=${email}`,
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
