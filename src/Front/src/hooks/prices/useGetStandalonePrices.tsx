import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CUSTOMER_PRICING_GROUP_MAP } from 'types/index';

import { QUERY_KEYS } from 'constants/index';
import { CurrencyCodes, getServiceLayerAPI } from 'utils/index';
import { baseProductPrice, useUserSession } from 'providers/index';
import { StandalonePrice, StandalonePriceMapping } from 'types/index';

interface Variables {
  skuList: string[];
  currencyCode: string;
  distributionChannelId?: string;
  enabled?: boolean;
}

const DEFINED_GROUPS = Object.values(CUSTOMER_PRICING_GROUP_MAP);

const buildWhereClause = ({ skuList, currencyCode, distributionChannelId }: Variables) => {
  const skuString = skuList.map((sku) => `"${sku}"`).join(', ');
  const where = `sku in (${skuString}) and value(currencyCode = "${currencyCode}") and channel(id = "${distributionChannelId}")`;

  return { where };
};

const transformDiscountedPrice = (standalonePrices: StandalonePrice[]) =>
  standalonePrices.map((price) => {
    const discountedPrice = price.custom?.customFieldsRaw.find(
      (customField) => customField.name === 'discounted-price'
    );

    if (discountedPrice?.value) {
      // the value comes not in cents, but in the value itself, convert it into the cent value
      const centAmount =
        parseFloat(discountedPrice.value) * Math.pow(10, baseProductPrice.fractionDigits);

      if (Number.isNaN(centAmount)) {
        return price;
      }

      const priceProps = price.discounted?.value ?? price.value;
      const isPriceAndsDiscountedEqual = centAmount === price?.value?.centAmount;

      return {
        ...price,
        ...(!isPriceAndsDiscountedEqual && {
          discounted: {
            ...price.discounted,
            value: {
              ...priceProps,
              centAmount,
            },
          },
        }),
      };
    }

    return price;
  });

export default function useGetStandalonePrices({
  skuList,
  distributionChannelId,
  customCurrencyCode,
  enabled = true,
}: Pick<
  Variables & { customCurrencyCode?: CurrencyCodes },
  'skuList' | 'distributionChannelId' | 'customCurrencyCode' | 'enabled'
>) {
  const { currencyCode } = useUserSession();
  let currentOffset = 0;
  let total = 0;
  const limit = 100;
  const { data, isPending, isFetching, error, refetch } = useQuery<StandalonePrice[]>({
    queryKey: [QUERY_KEYS.STANDALONE_PRICE, distributionChannelId, currencyCode, ...skuList],
    queryFn: async () => {
      if (!skuList?.length || !distributionChannelId) {
        return [];
      }
      const api = await getServiceLayerAPI();
      let allPrices: StandalonePrice[] = [];
      do {
        const variables = {
          limit,
          offset: currentOffset,
          ...buildWhereClause({
            skuList,
            currencyCode: customCurrencyCode ?? currencyCode,
            distributionChannelId,
          }),
        };

        const response = await api.post('', {
          query: 'GET_STANDALONE_PRICES',
          variables,
        });
        const standalonePrices = response.data.data.standalonePrices;
        const { results, total: fetchedTotal } = standalonePrices;

        const transformedPrices = transformDiscountedPrice(results);
        // Accumulate the fetched prices
        allPrices = [...allPrices, ...transformedPrices];

        // Update offset and total for pagination
        total = fetchedTotal;
        currentOffset += limit;
      } while (currentOffset < total);

      return allPrices;
    },
    enabled: enabled && Boolean(skuList.length && skuList.every(Boolean) && distributionChannelId),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const standalonePrices = useMemo(() => {
    return data
      ? data.reduce((accum, price) => {
          if (!DEFINED_GROUPS.includes(price.customerGroup?.key)) {
            return accum;
          }

          if (!accum[price.sku]) {
            accum[price.sku] = {};
          }

          return {
            ...accum,
            [price.sku]: {
              ...accum[price.sku],
              [price.customerGroup.key]: price,
            },
          };
        }, {} as StandalonePriceMapping)
      : undefined;
  }, [data]);

  const isGettingStandalonePrices = useMemo(
    () => (enabled ? isPending : isFetching),
    [enabled, isPending, isFetching]
  );

  return {
    refetch,
    standalonePrices,
    standalonePricesError: error,
    isGettingStandalonePrices,
  };
}
