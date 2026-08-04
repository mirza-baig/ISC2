import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_cache } from 'next/cache';
import { setAPIRouteHeaders } from 'utils/apiUtils';
import algoliasearch from 'algoliasearch/lite';
import { AlgoliaApiResponse } from 'types/forms';

const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || '';
const algoliaApiKey = process.env.ALGOLIA_API_KEY || '';
const algoliaAppId = process.env.ALGOLIA_APP_ID || '';
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);
const algoliaIndex = searchClient.initIndex(algoliaIndexName);

const CACHE_TTL = parseInt(process.env.PRODUCT_SEARCH_CACHE_TTL || '3600', 10);

type SearchParams = {
  facets: string[];
  productIds?: string[];
  skus?: string[];
  productKeys?: string[];
};

type CachedData = {
  results: AlgoliaApiResponse;
  cachedAt: string;
};

function generateCacheKey(params: SearchParams): string {
  return JSON.stringify({
    facets: [...params.facets].sort(),
    productIds: params.productIds ? [...params.productIds].sort() : [],
    skus: params.skus ? [...params.skus].sort() : [],
    productKeys: params.productKeys ? [...params.productKeys].sort() : [],
  });
}

const getProductSearchResults = async ({
  facets,
  productIds,
  skus,
  productKeys,
}: SearchParams): Promise<AlgoliaApiResponse> => {
  const facetFilters: (string | string[])[] = [...facets];
  if (productKeys?.length) {
    facetFilters.push(productKeys.map((key) => `productKey:${key}`));
  }
  if (skus?.length) {
    facetFilters.push(skus.map((id) => `sku:${id}`));
  }
  if (productIds?.length) {
    facetFilters.push(productIds.map((id) => `productID:${id}`));
  }

  const data: AlgoliaApiResponse = await algoliaIndex.search('', {
    facetFilters,
    facets: ['*'],
    hitsPerPage: skus?.length ? skus?.length : 1000,
  });

  const result = {
    facets: data?.facets || {},
    hits: data?.hits || [],
  };
  return result;
};

const getCachedProductSearch = unstable_cache(
  async (_cacheKey: string, params: SearchParams): Promise<CachedData> => {
    const cachedAt = new Date().toISOString();
    const fetchStartTime = Date.now();

    console.log('[CACHE] Fetching from Algolia | Product Search', {
      facets: params.facets,
      productIds: params.productIds?.length || 0,
      skus: params.skus?.length || 0,
      productKeys: params.productKeys?.length || 0,
    });

    const results = await getProductSearchResults(params);
    const fetchDuration = Date.now() - fetchStartTime;

    const dataSize = JSON.stringify(results).length;
    const sizeKB = (dataSize / 1024).toFixed(2);

    console.log(
      `[CACHE] Algolia fetch complete | Product Search | Results: ${results.hits.length} products | Size: ${sizeKB}KB | Time: ${fetchDuration}ms`
    );

    return { results, cachedAt };
  },
  ['product-search-cache'],
  {
    revalidate: CACHE_TTL,
    tags: ['product-search'],
  }
);

export default async function productFormSearch(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  const startTime = Date.now();
  const { body } = req;
  const requestId = `product_search_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (!body || !body.facets) {
    console.warn('[PRODUCT-SEARCH-API] Invalid request body - facets required');
    return res.status(400).send({ error: 'facets parameter is required' });
  }

  try {
    const searchParams: SearchParams = {
      facets: body.facets || [],
      productIds: body.productIds,
      skus: body.skus,
      productKeys: body.productKeys,
    };

    const cacheKey = generateCacheKey(searchParams);
    const cachedData = await getCachedProductSearch(cacheKey, searchParams);
    const totalDuration = Date.now() - startTime;

    const isCached = totalDuration < 200;
    const cacheStatus = isCached ? 'CACHED' : 'FRESH';

    const dataSize = JSON.stringify(cachedData.results).length;
    const sizeKB = (dataSize / 1024).toFixed(2);

    console.log(
      `[PRODUCT-SEARCH-API] ${cacheStatus} | Request ID: ${requestId} | Results: ${cachedData.results.hits.length} products | Size: ${sizeKB}KB | Time: ${totalDuration}ms`
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL * 1000);

    res.setHeader('Cache-Control', `s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`);
    res.setHeader('X-Cache-Status', cacheStatus);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Cached-At', cachedData.cachedAt);
    res.setHeader('X-Expires-At', expiresAt.toISOString());

    return res.status(200).send(cachedData.results);
  } catch (err) {
    const totalDuration = Date.now() - startTime;
    console.error(`[PRODUCT-SEARCH-API] ✗ Error searching Algolia (${totalDuration}ms):`, err);
    return res.status(404).send({ error: 'Error during algolia search request' });
  }
}
