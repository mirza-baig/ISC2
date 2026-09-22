import { NextApiRequest, NextApiResponse } from 'next';
import type { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createHash } from 'crypto';
import { z } from 'zod';
import { ELECTIONS_VOTING_USER_INFO, VOTING_TYPES_ROOT } from 'queries/votingSettings';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { setAPIRouteHeaders } from 'utils/apiUtils';
import { isItemName } from 'lib/api/urlPath';

interface VotingFieldValue {
  value: string;
}

interface VotingData {
  sharedKey?: VotingFieldValue;
  redirectUrl?: VotingFieldValue;
  parent?: {
    votingHashSuit?: VotingFieldValue;
  };
}

interface VotingGraphQLResult {
  votingData?: VotingData;
}

interface SessionUser {
  custom_attributes?: {
    user_id?: string;
  };
}

const MAX_VOTING_KEY_LENGTH = 100;

/**
 * A voting type item name, resolved beneath VOTING_TYPES_ROOT.
 *
 * Permissive by design (see lib/api/urlPath.ts): election items carry names like
 * "Board & Committee Election (2025)", and rejecting one would break the voting link
 * for every member who received it. Excluding `/` is what keeps the lookup inside
 * the Voting Types folder; the query document is parameterized regardless.
 */
export const votingKeySchema = z
  .string()
  .min(1)
  .max(MAX_VOTING_KEY_LENGTH)
  .refine(isItemName, 'voting key is not a valid item name');

const generateVotingToken = (
  memberNumber: string,
  sharedKey: string,
  hashSuite: string
): string => {
  const data = memberNumber + sharedKey;
  const hash = createHash(hashSuite.toLowerCase()).update(data).digest('hex');
  return hash.toUpperCase();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions(req) as AuthOptions);

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const memberNumber = (session.user as SessionUser)?.custom_attributes?.user_id;

  if (!memberNumber) {
    return res.status(403).json({ error: 'Member ID not found' });
  }

  const parsedKey = votingKeySchema.safeParse(req.query.v);

  if (!parsedKey.success) {
    return res.status(400).json({ error: 'Voting key required' });
  }

  try {
    const graphQLResult = await getGraphQLResult<VotingGraphQLResult>(ELECTIONS_VOTING_USER_INFO, {
      path: `${VOTING_TYPES_ROOT}/${parsedKey.data}`,
      language: 'en',
    });

    if (!graphQLResult?.votingData) {
      return res.status(404).json({ error: 'Voting data not found' });
    }

    const { votingData } = graphQLResult;
    const sharedKey = votingData.sharedKey?.value;
    const redirectUrl = votingData.redirectUrl?.value;
    const votingHashSuit = votingData.parent?.votingHashSuit?.value;

    if (!sharedKey || !redirectUrl || !votingHashSuit) {
      return res.status(400).json({ error: 'Invalid voting configuration' });
    }

    const votingToken = generateVotingToken(memberNumber, sharedKey, votingHashSuit);

    return res.status(200).json({
      token: votingToken,
      redirectUrl,
      memberNumber,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process voting redirect' });
  }
}
