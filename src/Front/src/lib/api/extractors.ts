import type { NextApiRequest } from 'next';

/**
 * Pulls the raw input for a route out of the request, so a handler never has to
 * reach into `req` itself. See GraphQL-API-Patterns.md §3.
 */
export type Extractor = (req: NextApiRequest) => unknown;

export const fromQuery: Extractor = (req) => req.query;

export const fromBody: Extractor = (req) => req.body;

/** Merges several extractors into one object, keyed by name. */
export const composite =
  (extractors: Record<string, Extractor>): Extractor =>
  (req) =>
    Object.fromEntries(Object.entries(extractors).map(([name, extract]) => [name, extract(req)]));
