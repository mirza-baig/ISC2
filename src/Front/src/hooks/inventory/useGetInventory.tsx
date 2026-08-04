import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from 'constants/index';
import { getServiceLayerAPI } from 'utils/index';
import { Inventory } from 'types/inventory';
import { useMemo } from 'react';

interface Variables {
  skuList: string[];
  enabled?: boolean;
}

const buildWhereClause = ({ skuList }: Variables) => {
  const skuString = skuList.map((sku) => `"${sku}"`).join(', ');
  const where = `sku in (${skuString})`;
  return { where };
};

export default function useGetInventory({
  skuList,
  enabled = true,
}: Pick<Variables, 'skuList' | 'enabled'>) {
  let currentOffset = 0;
  let total = 0;
  const limit = 100;
  const { data, isPending, error } = useQuery<Inventory[]>({
    queryKey: [QUERY_KEYS.INVENTORY, ...skuList],
    queryFn: async () => {
      if (!skuList?.length) {
        return [];
      }
      const api = await getServiceLayerAPI();
      let allInventory: Inventory[] = [];
      do {
        const variables = {
          limit,
          offset: currentOffset,
          ...buildWhereClause({
            skuList,
          }),
        };
        const response = await api.post('', {
          query: 'GET_INVENTORY',
          variables,
        });
        const inventoryEntries = response.data.data.inventoryEntries;
        const { results, total: fetchedTotal } = inventoryEntries;
        // Accumulate the fetched prices
        allInventory = [...allInventory, ...results];
        // Update offset and total for pagination
        total = fetchedTotal;
        currentOffset += limit;
      } while (currentOffset < total);
      return allInventory;
    },
    enabled: enabled && Boolean(skuList.length && skuList.every(Boolean)),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const inventoryEntries: { [sku: string]: number } = useMemo(() => {
    return (
      data?.reduce((acc, inventory) => {
        return {
          ...acc,
          [inventory.sku]: inventory.quantityOnStock,
        };
      }, {}) || {}
    );
  }, [data]);

  return {
    inventoryEntries,
    inventoryEntriesError: error,
    isGettingInventoryEntries: isPending,
  };
}
