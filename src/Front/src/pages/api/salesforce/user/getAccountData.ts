import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAccountDataFromMulesoft, setAPIRouteHeaders, validateApiRequest } from 'utils/index';

const ALLOWED_ACCOUNT_FIELDS = [
  'communicationPreferences',
  'PreferredLanguage',
  'boardElectionEligible',
  'bodNominationAccess',
  'accountContactRelations',
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET', req);
  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { externalID, email } = identity;

  try {
    const data = await fetchAccountDataFromMulesoft(externalID, email);
    const accountData = data?.data?.salesforceGetAccountData;

    if (!accountData) {
      return res.status(200).send({ data: {} });
    }

    const salesforceGetAccountData: Partial<typeof accountData> = {};
    ALLOWED_ACCOUNT_FIELDS.forEach((field) => {
      if (field in accountData) {
        Object.assign(salesforceGetAccountData, { [field]: accountData[field] });
      }
    });

    return res.status(200).send({ data: { salesforceGetAccountData } });
  } catch (error) {
    console.error('Error while fetching account data', error);

    return res.status(500).send({ error: 'Error while fetching account data.' });
  }
}
