import { useMemo } from 'react';

import { useLineItems } from 'providers/index';
import { useGetAlgoliaSitecoreData } from 'hooks/index';
import { isDonationItem } from 'utils/index';
import type { CartLineItem } from 'types/index';

export default function useB2BCartThumbnails(items: CartLineItem[]) {
  const { algoliaIndex } = useLineItems();

  const productKeysList = useMemo(
    () =>
      Array.from(
        new Set(items.map((li) => li.productKey).filter((key): key is string => Boolean(key)))
      ),
    [items]
  );

  const { algoliaBulkData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList,
    algoliaIndex,
  });

  const thumbnailByProductKey = useMemo(() => {
    const map = new Map<string, string>();

    (algoliaBulkData ?? []).forEach((hit) => {
      if (hit?.objectID && hit.thumbnailImage) {
        map.set(String(hit.objectID), hit.thumbnailImage);
      }
    });

    return map;
  }, [algoliaBulkData]);

  return useMemo(
    () => ({
      showThumbnail: (item: CartLineItem) => !isDonationItem(item?.name),
      getThumbnail: (item: CartLineItem) =>
        item?.productKey ? thumbnailByProductKey.get(item.productKey) : undefined,
      isLoading: algoliaDataIsLoading,
    }),
    [algoliaDataIsLoading, thumbnailByProductKey]
  );
}

export type B2BCartThumbnails = ReturnType<typeof useB2BCartThumbnails>;
