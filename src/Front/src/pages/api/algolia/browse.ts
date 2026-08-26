import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_cache } from 'next/cache';
import algoliasearch from 'algoliasearch/lite';
import { setAPIRouteHeaders } from 'utils/apiUtils';

const algoliaApiKey = process.env.ALGOLIA_API_KEY || '';
const algoliaAppId = process.env.ALGOLIA_APP_ID || '';
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

// Cache TTL guard (F4 - Algolia usage): the initial unfiltered "browse everything" query that every
// listing page fires on load is identical for all visitors, so it is served from one shared server
// cache instead of running browser->Algolia on every page view (and every bot hit). Falls back to the
// default when the env value is missing or implausibly low. Set BROWSE_CACHE_TTL >= 60 to override.
const BROWSE_TTL_DEFAULT = 1800; // 30 minutes - listing content only changes on publish
const parsedBrowseTtl = parseInt(process.env.BROWSE_CACHE_TTL || '', 10);
const CACHE_TTL =
  Number.isFinite(parsedBrowseTtl) && parsedBrowseTtl >= 60 ? parsedBrowseTtl : BROWSE_TTL_DEFAULT;

type MultiQuery = { indexName: string; params?: Record<string, unknown> };

// The exact multi-query the browser would have sent - run once, cached, shared by all visitors.
const getCachedBrowse = unstable_cache(
  async (_cacheKey: string, requests: MultiQuery[]) => {
    return searchClient.search(requests as Parameters<typeof searchClient.search>[0]);
  },
  ['algolia-browse'],
  { revalidate: CACHE_TTL, tags: ['algolia-browse'] }
);

export default async function browse(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST,OPTIONS', req);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  const requests = req.body?.requests as MultiQuery[] | undefined;
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).send({ error: 'requests array is required' });
  }

  try {
    // Identical initial browse -> identical key -> one shared cache entry across all visitors.
    const cacheKey = JSON.stringify(requests);
    const data = await getCachedBrowse(cacheKey, requests);
    res.setHeader('Cache-Control', `s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`);
    return res.status(200).send(data);
  } catch {
    return res.status(502).send({ error: 'Browse cache fetch failed' });
  }
}
