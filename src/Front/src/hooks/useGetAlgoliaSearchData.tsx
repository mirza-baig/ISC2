import { useQuery } from '@tanstack/react-query';
import { ProductHit } from 'types/index';
import { QUERY_KEYS } from 'constants/index';
import { getProductSelectorSearchResult } from 'utils/index';

export default function useGetAlgoliaSearchData({ productKeys }: { productKeys: string[] | [] }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.ALGOLIA_DATA, productKeys],
    queryFn: async () => {
      const { hits } = await getProductSelectorSearchResult({
        productKeys,
      });

      if (hits.length) {
        return hits;
      }

      return [];
    },
    enabled: Boolean(productKeys?.length),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    algoliaData: data as ProductHit[],
    algoliaDataIsLoading: isLoading,
    algoliaDataError: error,
  };
}
