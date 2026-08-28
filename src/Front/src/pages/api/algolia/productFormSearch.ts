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

const PRODUCT_SEARCH_TTL_DEFAULT = 3600;
const parsedProductSearchTtl = parseInt(process.env.PRODUCT_SEARCH_CACHE_TTL || '', 10);
const CACHE_TTL =
  Number.isFinite(parsedProductSearchTtl) && parsedProductSearchTtl >= 60
    ? parsedProductSearchTtl
    : PRODUCT_SEARCH_TTL_DEFAULT;

const PRODUCT_FORM_ATTRIBUTES = [
  'sku',
  'productID',
  'productKey',
  'title',
  'parentTitle',
  'copyName',
  'description',
  'productMessage',
  'productType',
  'productTypeLabel',
  'isMasterVariant',
  'link',
  'division',
  'modality',
  'duration',
  'trainingProvider',
  'region',
  'city',
  'state',
  'country',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'timeZone',
  'timeZoneIana',
  'daysOfWeek',
  'itemsRef',
  'itemVariantSkuList',
  'itemProductKeyList',
  'expand',
  'skuReferencesProduct',
  'skuReferencesVariant',
];

const PRODUCT_FORM_FACETS = [
  'sku',
  'region.key',
  'country',
  'state',
  'city',
  'duration.key',
  'trainingProvider.key',
  'startDate',
  'endDate',
];

const MAX_VARIANTS_PER_PRODUCT = 100;
const MAX_HITS_PER_PAGE = 1000;

const resolveHitsPerPage = ({ productIds, skus, productKeys }: SearchParams): number => {
  // A sku filter matches at most one record per sku.
  if (skus?.length) {
    return skus.length;
  }
  const productCount = (productKeys?.length || 0) + (productIds?.length || 0);
  if (!productCount) {
    return MAX_HITS_PER_PAGE;
  }
  return Math.min(productCount * MAX_VARIANTS_PER_PRODUCT, MAX_HITS_PER_PAGE);
};

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
    facets: PRODUCT_FORM_FACETS,
    attributesToRetrieve: PRODUCT_FORM_ATTRIBUTES,
    // The query is always empty, so highlighting only adds a duplicate copy of the matched
    // attributes to every hit.
    attributesToHighlight: [],
    hitsPerPage: resolveHitsPerPage({ facets, productIds, skus, productKeys }),
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
    const results = await getProductSearchResults(params);

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
