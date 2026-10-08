import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { SearchIndex } from 'algoliasearch';

import { AlgoliaSettings, CartLineItem } from 'types/index';
import { QUERY_KEYS } from 'constants/index';
import { getPriceQuantityFor } from 'utils/index';
import { createPublicSearchClient } from 'lib/algolia/credentials';

type LineItemsContextProps = {
  isFetchingCart: boolean;
  isRemovingFromCart: boolean;
  algoliaIndex: SearchIndex | null;
  lineItemHasDiscounts: (lineItem: CartLineItem) => boolean;
};

const LineItemsContext = createContext<LineItemsContextProps>({
  isFetchingCart: false,
  isRemovingFromCart: false,
  algoliaIndex: null,
  lineItemHasDiscounts: () => false,
});

type LineItemsProviderProps = {
  algoliaSettings: AlgoliaSettings;
  children: React.ReactNode;
};

const LineItemsProvider: React.FC<LineItemsProviderProps> = ({ algoliaSettings, children }) => {
  const isRemovingFromCart = useIsMutating({ mutationKey: [QUERY_KEYS.REMOVE_FROM_CART] });
  const isFetchingCart = useIsFetching({ queryKey: [QUERY_KEYS.ACTIVE_CART] });

  const lineItemHasDiscounts = useCallback(
    (lineItem: CartLineItem) =>
      Boolean(
        lineItem.nonMemberPrice?.centAmount &&
          lineItem.totalPrice?.centAmount !==
            lineItem.nonMemberPrice?.centAmount * getPriceQuantityFor(lineItem)
      ),
    []
  );

  const algoliaIndex = useMemo(() => {
    const {
      algoliaDetails: { algoliaIndexName },
    } = algoliaSettings;

    // Credentials come from the environment, not from the Sitecore item — see
    // src/lib/algolia/credentials.ts (finding H-04). The index name is still content.
    const client = createPublicSearchClient();

    if (!client || !algoliaIndexName?.value) {
      return null;
    }

    return client.initIndex(algoliaIndexName.value);
  }, [algoliaSettings]);

  return (
    <LineItemsContext.Provider
      value={{
        algoliaIndex,
        lineItemHasDiscounts,
        isRemovingFromCart: isRemovingFromCart > 0,
        isFetchingCart: isFetchingCart > 0,
      }}
    >
      {children}
    </LineItemsContext.Provider>
  );
};

const useLineItems = () => useContext(LineItemsContext);

export { LineItemsProvider, useLineItems };
