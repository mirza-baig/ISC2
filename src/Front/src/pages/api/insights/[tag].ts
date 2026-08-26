import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_cache } from 'next/cache';
import { fetchInsightsFromAlgolia, AlgoliaInsightResult } from 'utils/algoliaInsights';

type CachedInsightsResponse = {
  tag: string;
  results: AlgoliaInsightResult[];
  cachedAt: string;
  expiresAt: string;
};

type CachedData = {
  results: AlgoliaInsightResult[];
  cachedAt: string;
};

// Cache TTL guard (F4 - Algolia usage): fall back to the 1-hour default when the
// configured value is missing or implausibly low (e.g. a stray "5"), so a misconfig
// can't defeat the read cache. Insights articles change rarely; sub-minute caching
// here is never intended. Set a value >= 60 to override.
const INSIGHTS_TTL_DEFAULT = 3600;
const parsedInsightsTtl = parseInt(process.env.INSIGHTS_CACHE_TTL || '', 10);
const CACHE_TTL =
  Number.isFinite(parsedInsightsTtl) && parsedInsightsTtl >= 60
    ? parsedInsightsTtl
    : INSIGHTS_TTL_DEFAULT;

const getCachedInsights = unstable_cache(
  async (tag: string): Promise<CachedData> => {
    const cachedAt = new Date().toISOString();
    const fetchStartTime = Date.now();

    console.log(`[CACHE] Fetching from Algolia | Tag: "${tag}"`);

    const results = await fetchInsightsFromAlgolia(tag);
    const fetchDuration = Date.now() - fetchStartTime;

    const dataSize = JSON.stringify(results).length;
    const sizeKB = (dataSize / 1024).toFixed(2);

    console.log(
      `[CACHE] Algolia fetch complete | Tag: "${tag}" | Results: ${results.length} articles | Size: ${sizeKB}KB | Time: ${fetchDuration}ms`
    );

    return { results, cachedAt };
  },
  ['insights-cache'],
  {
    revalidate: CACHE_TTL,
    tags: ['insights'],
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { tag } = req.query;
  const requestId = `insights_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (req.method !== 'GET') {
    console.warn(`[INSIGHTS-API] Method not allowed: ${req.method}`);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!tag || typeof tag !== 'string') {
    console.warn('[INSIGHTS-API] Invalid tag parameter');
    return res.status(400).json({ message: 'Tag parameter is required' });
  }

  try {
    const cachedData = await getCachedInsights(tag);
    const totalDuration = Date.now() - startTime;

    const isCached = totalDuration < 200;
    const cacheStatus = isCached ? 'CACHED' : 'FRESH';

    const dataSize = JSON.stringify(cachedData.results).length;
    const sizeKB = (dataSize / 1024).toFixed(2);

    console.log(
      `[INSIGHTS-API] ${cacheStatus} | Tag: "${tag}" | Request ID: ${requestId} | Results: ${cachedData.results.length} articles | Size: ${sizeKB}KB | Time: ${totalDuration}ms`
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL * 1000);

    const response: CachedInsightsResponse = {
      tag,
      results: cachedData.results,
      cachedAt: cachedData.cachedAt,
      expiresAt: expiresAt.toISOString(),
    };

    res.setHeader('Cache-Control', `s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`);
    res.setHeader('X-Cache-Status', cacheStatus);
    res.setHeader('X-Request-ID', requestId);

    return res.status(200).json(response);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(
      `[INSIGHTS-API] ✗ Error fetching insights for "${tag}" (${totalDuration}ms):`,
      error
    );
    return res.status(500).json({
      message: 'Failed to fetch insights',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
