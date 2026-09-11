import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CUSTOMER_PRICING_GROUP_MAP } from 'types/index';

import { QUERY_KEYS } from 'constants/index';
import { CurrencyCodes } from 'utils/index';
import { useUserSession } from 'providers/index';
import { StandalonePrice, StandalonePriceMapping } from 'types/index';
import { fetchAllStandalonePricePages } from './standalonePriceQueryHelpers';

interface Variables {
  skuList: string[];
  currencyCode: string;
  distributionChannelId?: string;
  enabled?: boolean;
}

const DEFINED_GROUPS = Object.values(CUSTOMER_PRICING_GROUP_MAP);

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
  // 500 is commercetools' maximum page size. A SKU carries one price per customer group, so a batch
  // of N SKUs returns several times N rows and can still overflow one page.
  const limit = 500;
  const { data, isPending, isFetching, error, refetch } = useQuery<StandalonePrice[]>({
    queryKey: [QUERY_KEYS.STANDALONE_PRICE, distributionChannelId, currencyCode, ...skuList],
    queryFn: () =>
      fetchAllStandalonePricePages({
        skuList,
        currencyCode: customCurrencyCode ?? currencyCode,
        distributionChannelId,
        limit,
      }),
    enabled: enabled && Boolean(skuList.length && skuList.every(Boolean) && distributionChannelId),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { standalonePrices, unrecognizedCustomerGroupPrices } = useMemo(() => {
    if (!data) {
      return { standalonePrices: undefined, unrecognizedCustomerGroupPrices: [] };
    }

    const misses: { sku: string; customerGroupKey?: string }[] = [];

    const prices = data.reduce((accum, price) => {
      const customerGroupKey = price.customerGroup?.key;

      if (!customerGroupKey || !DEFINED_GROUPS.includes(customerGroupKey)) {
        misses.push({ sku: price.sku, customerGroupKey });
        return accum;
      }

      if (!accum[price.sku]) {
        accum[price.sku] = {};
      }

      return {
        ...accum,
        [price.sku]: {
          ...accum[price.sku],
          [customerGroupKey]: price,
        },
      };
    }, {} as StandalonePriceMapping);

    return { standalonePrices: prices, unrecognizedCustomerGroupPrices: misses };
  }, [data]);

  useEffect(() => {
    if (!unrecognizedCustomerGroupPrices.length) {
      return;
    }

    console.warn(
      '[STANDALONE-PRICE] Dropped price row(s) with an unrecognized/missing customer group',
      unrecognizedCustomerGroupPrices
    );

    void fetch('/api/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        event: 'standalone_price_unrecognized_customer_group',
        level: 'warn',
        payload: { prices: unrecognizedCustomerGroupPrices },
      }),
    }).catch((err) => {
      console.warn('[STANDALONE-PRICE] Failed to send client log', err);
    });
  }, [unrecognizedCustomerGroupPrices]);

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
