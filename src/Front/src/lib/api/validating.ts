import type { NextApiRequest, NextApiResponse } from 'next';
import type { ZodSchema } from 'zod';

import type { Extractor } from './extractors';

/**
 * Wraps a handler so it only ever runs against input that satisfies `schema`.
 *
 * The point is structural: the handler signature receives the parsed value and has
 * no access to raw request data, so unvalidated input cannot reach a downstream
 * query by omission. See GraphQL-API-Patterns.md §3.
 */
export type ValidatedHandler<T> = (
  input: T,
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void | unknown> | void | unknown;

export function validating<T>({
  schema,
  handler,
  extractor,
}: {
  schema: ZodSchema<T>;
  handler: ValidatedHandler<T>;
  extractor: Extractor;
}): ApiHandler {
  return async function validatingApiHandler(req: NextApiRequest, res: NextApiResponse) {
    const parsed = schema.safeParse(extractor(req));

    if (!parsed.success) {
      // RFC 9457 problem+json.
      res.setHeader('Content-Type', 'application/problem+json');

      return res.status(400).json({
        type: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred',
        status: 400,
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return handler(parsed.data, req, res);
  };
}
