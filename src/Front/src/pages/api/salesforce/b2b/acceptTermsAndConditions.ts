import { ALLOCATION_FLOW, ALLOCATION_TERMS_AND_CONDITIONS } from 'constants/index';
import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

export default async function acceptTermsAndConditions(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;
  const { isConsentAccepted, flow } = req.body;

  try {
    const response = await fetch(
      `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/termsAndConditionsAuditLogs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
          client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
        },
        body: JSON.stringify({
          externalID,
          email,
          termsAndConditions: Boolean(isConsentAccepted)
            ? ALLOCATION_TERMS_AND_CONDITIONS.ACCEPTED
            : ALLOCATION_TERMS_AND_CONDITIONS.REJECTED,
          flow: flow ?? ALLOCATION_FLOW,
        }),
      }
    );

    const data = await response.json();

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send({ error });
  }
}
