import type { NextApiRequest } from 'next';

export type Extractor = (req: NextApiRequest) => unknown;

export const fromQuery: Extractor = (req) => req.query;

export const fromBody: Extractor = (req) => req.body;

/** Merges several extractors into one object, keyed by name. */
export const composite =
  (extractors: Record<string, Extractor>): Extractor =>
  (req) =>
    Object.fromEntries(Object.entries(extractors).map(([name, extract]) => [name, extract(req)]));
