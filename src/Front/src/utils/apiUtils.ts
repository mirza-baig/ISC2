import { NextApiRequest, NextApiResponse } from 'next';

import { resolveCorsHeaders } from 'lib/security/cors';

export const setAPIRouteHeaders = (
  res: NextApiResponse,
  allowedMethods: string,
  req: NextApiRequest
) => {
  res.setHeader('Content-Type', 'application/json');

  Object.entries(resolveCorsHeaders(req.headers.origin, allowedMethods)).forEach(([key, value]) =>
    res.setHeader(key, value)
  );
};
