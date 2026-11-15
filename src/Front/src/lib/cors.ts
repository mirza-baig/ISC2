export const CORS_ALLOWED_HEADERS =
  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version';

const toOrigin = (value: string): string | null => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

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
