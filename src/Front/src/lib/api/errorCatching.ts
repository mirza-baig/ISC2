import type { NextApiRequest, NextApiResponse } from 'next';

import type { ApiHandler } from './validating';
import type { Wrapper } from './wrap';

/**
 * Turns any thrown error into a generic 500, logging the detail server-side.
 *
 * Replaces patterns like `res.status(500).send(err)`, which shipped the raw axios
 * error — including the outbound request config and headers — to the caller.
 */
export function errorCatching({ label }: { label: string }): Wrapper {
  return function errorCatchingWrap(handler: ApiHandler): ApiHandler {
    return async function errorCatchingApiHandler(req: NextApiRequest, res: NextApiResponse) {
      try {
        return await handler(req, res);
      } catch (err) {
        console.error(`[${label}]`, err instanceof Error ? err.message : err);

        res.setHeader('Content-Type', 'application/problem+json');

        return res.status(500).json({
          type: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.1',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred.',
        });
      }
    };
  };
}
