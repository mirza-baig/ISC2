import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import { setAPIRouteHeaders } from 'utils/apiUtils';
import { validateApiRequest } from 'utils/validateApiRequest';

type ClientLogBody = {
  event?: string;
  level?: 'error' | 'warn' | 'info';
  payload?: unknown;
};

const SENSITIVE_KEYS = new Set([
  'email',
  'useremail',
  'customeremail',
  'cartcustomeremail',
  'emailaddress',
  'street',
  'streetname',
  'addressline1',
  'addressline2',
  'postalcode',
  'zipcode',
  'phone',
  'phonenumber',
  'workphone',
  'firstname',
  'lastname',
]);

const hashEmail = (email: string): string =>
  crypto
    .createHmac(
      'sha256',
      process.env.CLIENT_LOG_HASH_SECRET || process.env.NEXTAUTH_SECRET || 'client-log'
    )
    .update(email.trim().toLowerCase())
    .digest('hex');

const getEmailDomain = (email: string): string | undefined => email.split('@')[1]?.toLowerCase();

const redactSensitiveFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveFields);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
    (sanitized, [key, entryValue]) => {
      const normalizedKey = key.toLowerCase();
      sanitized[key] = SENSITIVE_KEYS.has(normalizedKey)
        ? '[redacted]'
        : redactSensitiveFields(entryValue);

      return sanitized;
    },
    {}
  );
};

async function handleClientLog(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  setAPIRouteHeaders(res, 'POST, OPTIONS', req);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const identity = await validateApiRequest(req, res);

  if (!identity) {
    return;
  }

  const { event, level = 'error', payload } = req.body as ClientLogBody;
  const sanitizedPayload = redactSensitiveFields(payload);
  const logPayload = {
    event: event || 'client_log',
    sessionExternalID: identity.externalID,
    sessionEmailHash: hashEmail(identity.email),
    sessionEmailDomain: getEmailDomain(identity.email),
    payload: sanitizedPayload,
    timestamp: new Date().toISOString(),
  };

  if (level === 'warn') {
    console.warn('[CLIENT-LOG]', logPayload);
  } else if (level === 'info') {
    console.log('[CLIENT-LOG]', logPayload);
  } else {
    console.error('[CLIENT-LOG]', logPayload);
  }

  res.status(204).end();
  return;
}

export default async function clientLog(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  await handleClientLog(req, res);
}
