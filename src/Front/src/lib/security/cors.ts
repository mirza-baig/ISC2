/**
 * Single source of truth for CORS response headers (pentest finding: wildcard origin
 * with credentials on /api/services/data).
 *
 * Kept free of Node APIs so both Pages Router API routes and the edge middleware can use it.
 *
 * Rules:
 * - Only an exact match against the allowlist is reflected back, together with credentials.
 * - Anything else (missing Origin, foreign origin, the literal "null") gets NO
 *   Access-Control-Allow-Origin / -Credentials at all — never "*" and never an empty value.
 * - `Vary: Origin` is always sent so shared caches don't serve one origin's response to another.
 */

export const CORS_ALLOWED_HEADERS =
  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version';

const toOrigin = (value: string): string | null => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

/** PUBLIC_URL plus any comma-separated CORS_ALLOWED_ORIGINS, normalised to bare origins. */
export const getAllowedOrigins = (): string[] => {
  const candidates = [
    process.env.PUBLIC_URL || '',
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
  ];

  return candidates
    .filter((value) => value.trim().length > 0)
    .map(toOrigin)
    .filter((origin): origin is string => !!origin && origin !== 'null');
};

export const resolveCorsHeaders = (
  origin: string | string[] | null | undefined,
  allowedMethods: string,
  allowedHeaders: string = CORS_ALLOWED_HEADERS
): Record<string, string> => {
  const headers: Record<string, string> = { Vary: 'Origin' };

  if (typeof origin !== 'string' || !getAllowedOrigins().includes(origin)) {
    return headers;
  }

  return {
    ...headers,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
  };
};
