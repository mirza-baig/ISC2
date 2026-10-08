import { NextApiRequest, NextApiResponse } from 'next';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

const ALLOCATION_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

export default async function getAllocationById(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET', req);

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { allocationId } = req.query;

  if (!allocationId || typeof allocationId !== 'string') {
    return res.status(500).send({ error: 'No allocation ID is provided' });
  }

  if (!ALLOCATION_ID_PATTERN.test(allocationId)) {
    return res.status(400).send({ error: 'Invalid allocation ID' });
  }

  const { externalID, email } = identity;

  try {
    const response = await fetch(
      `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/b2b/allocations/${encodeURIComponent(
        allocationId
      )}?externalID=${encodeURIComponent(externalID)}&email=${encodeURIComponent(email)}`,
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
        'Error while fetching allocation by id',
        data.error || data.message || data.Description
      );
      throw 'Error while fetching allocation by id. See server logs for more information.';
    }

    const allocatedUsers: { email?: string }[] = Array.isArray(data?.users) ? data.users : [];

    if (allocatedUsers.length > 0) {
      const isAuthorizedForAllocation = allocatedUsers.some(
        (allocatedUser) =>
          typeof allocatedUser?.email === 'string' &&
          allocatedUser.email.trim().toLowerCase() === email.trim().toLowerCase()
      );

      if (!isAuthorizedForAllocation) {
        console.warn(
          `[IDOR] user=${externalID} attempted to access allocation=${allocationId} they are not part of`
        );
        return res.status(403).send({ error: 'Not authorized to view this allocation' });
      }
    }

    return res.status(200).send(data || {});
  } catch (error) {
    return res.status(500).send({ error });
  }
}
