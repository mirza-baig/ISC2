import { useQuery } from '@tanstack/react-query';
import { SearchIndex } from 'algoliasearch';
import { LineItemAlgoliaData } from 'types/index';
import { QUERY_KEYS } from 'constants/index';

export default function useGetAlgoliaSitecoreData({
  productKeysList,
  algoliaIndex,
}: {
  productKeysList: string[] | [];
  algoliaIndex?: SearchIndex | null;
}) {
  const hasKeys = Boolean(productKeysList?.length);
  const canQuery = hasKeys && Boolean(algoliaIndex);

  const { data, isPending, isFetching, error } = useQuery({
    queryKey: [QUERY_KEYS.ALGOLIA_DATA, productKeysList],
    queryFn: async () => {
      if (algoliaIndex) {
        const { hits } = await algoliaIndex.search<LineItemAlgoliaData>('', {
          facetFilters: productKeysList?.length
            ? [productKeysList.map((key) => `objectID:${key}`)]
            : [],
          attributesToRetrieve: ['title', 'thumbnailImage', 'url', 'path', 'productType'],
          maxFacetHits: productKeysList?.length || 1000,
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
