import { useMemo } from 'react';

import { useGetAlgoliaSitecoreData } from 'hooks/index';
import { useCart, useLineItems } from 'providers/index';

import { MiniCartLineItem } from './MiniCartLineItem';

/**
 * Renders the mini-cart rows from a single batched Algolia search.
 *
 * This lives in its own component because MiniCart renders LineItemsProvider,
 * so it cannot read `algoliaIndex` off that context itself.
 */
export const MiniCartLineItems = () => {
  const { activeCart } = useCart();
  const { algoliaIndex } = useLineItems();

  const productKeysList = useMemo(
    () => (activeCart.lineItems ?? []).map((lineItem) => lineItem.productKey),
    [activeCart.lineItems]
  );

  const { algoliaBulkData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList,
    algoliaIndex,
  });

  return (
    <ul className="flex flex-col flex-1 w-full px-4 divide-y slider-scrollbar divide-gray-30 overflow-y-auto">
      {activeCart.lineItems?.map((lineItem) => (
        <MiniCartLineItem
          key={lineItem.id}
          lineItem={lineItem}
          algoliaData={algoliaBulkData?.find((product) => product.objectID === lineItem.productKey)}
          algoliaDataIsLoading={algoliaDataIsLoading}
        />
      ))}
    </ul>
  );
};
