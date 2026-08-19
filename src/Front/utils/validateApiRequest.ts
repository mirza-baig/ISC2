import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { AuthOptions } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

interface SessionUser {
  custom_attributes?: {
    user_id?: string;
    email?: string;
    email_address?: string;
  };
}

interface ValidatedIdentity {
  externalID: string;
  email: string;
}

export async function validateApiRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ValidatedIdentity | null> {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigin = process.env.PUBLIC_URL;

  if (allowedOrigin && origin) {
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
    if (
      normalizedOrigin !== normalizedAllowed &&
      !normalizedOrigin.startsWith(`${normalizedAllowed}/`)
    ) {
      console.warn(
        `[CSRF] Origin mismatch: expected=${allowedOrigin}, got=${origin}, ip=${req.socket.remoteAddress}`
      );
      res.status(403).json({ error: 'Forbidden: origin not allowed' });
      return null;
    }
  }

  const session = await getServerSession(req, res, authOptions(req) as AuthOptions);

  if (!session) {
    console.warn(`[CSRF] Unauthenticated request: url=${req.url}, ip=${req.socket.remoteAddress}`);
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }

  const user = session.user as SessionUser;
  const externalID = user?.custom_attributes?.user_id;
  const email = user?.custom_attributes?.email || user?.custom_attributes?.email_address;

  if (!externalID || !email) {
    console.warn(
      `[CSRF] Missing identity in session: url=${req.url}, ip=${req.socket.remoteAddress}`
    );
    res.status(403).json({ error: 'User identity not found in session' });
    return null;
  }

  console.log(`[AUDIT] ${req.method} ${req.url} user=${externalID} ip=${req.socket.remoteAddress}`);

  return { externalID, email };
}
