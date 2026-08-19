import { useQuery } from '@tanstack/react-query';
import { SearchIndex } from 'algoliasearch';
import { useMemo } from 'react';
import { LineItemAlgoliaData } from 'types/index';
import { QUERY_KEYS } from 'constants/index';

export default function useGetAlgoliaSitecoreData({
  productKeysList,
  algoliaIndex,
}: {
  productKeysList: string[] | [];
  algoliaIndex?: SearchIndex | null;
}) {
  // Empty keys are dropped so they never reach Algolia, and the rest are
  // de-duplicated and sorted so that callers asking for the same products in a
  // different order share a single query. The cart and the mini-cart render at
  // the same time on /cart, and this is what collapses them to one request.
  const productKeys = useMemo(
    () => Array.from(new Set((productKeysList ?? []).filter(Boolean))).sort(),
    [productKeysList]
  );

  const hasKeys = productKeys.length > 0;
  const canQuery = hasKeys && Boolean(algoliaIndex);

  const { data, isPending, isFetching, error } = useQuery({
    queryKey: [QUERY_KEYS.ALGOLIA_DATA, productKeys],
    queryFn: async () => {
      if (algoliaIndex) {
        const { hits } = await algoliaIndex.search<LineItemAlgoliaData>('', {
          facetFilters: [productKeys.map((key) => `objectID:${key}`)],
          attributesToRetrieve: ['title', 'thumbnailImage', 'url', 'path', 'productType'],
          // Algolia defaults to 20 hits. One search per product never reached
          // that, but a batched one would silently drop items from a big cart.
          hitsPerPage: productKeys.length,
        });

        if (hits.length) {
          return hits;
        }
      }

      return [];
    },
    enabled: canQuery,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const algoliaDataIsLoading =
    hasKeys && (!algoliaIndex || (canQuery && (isPending || isFetching)));

  return {
    algoliaData: data && (data[0] as LineItemAlgoliaData),
    algoliaBulkData: data as LineItemAlgoliaData[],
    algoliaDataIsLoading,
    algoliaDataError: error,
  };
}
