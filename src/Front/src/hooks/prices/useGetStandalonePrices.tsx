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

/** Max price pages in flight at once — see the comment at the loop that uses it. */
const CONCURRENT_PAGE_REQUESTS = 4;

// Zero-amount price rows on a bundle SKU crash the whole standalone-price response, not just that
// row: the gateway's `removeCustomDiscountedPrice` middleware inspects only SKUs starting with
// `BUNDLE-`, and on those it reads `result.custom.customFieldsRaw` after an early return that never
// fires when `custom` is null (`undefined === -1` is false). It then compares `Number('0')` against
// `value.centAmount`, so a zero-amount row with no custom field matches and dereferences null — the
// GraphQL request comes back as an error and every SKU in that wave goes unpriced. The PLP feels
// this hardest because it queues its whole result set in waves of 250.
//
// A catalog-wide census (2026-08-05, all 1144 SKUs) found exactly three such rows, all bundles:
// BUNDLE-AIM-KIT, BUNDLE-KIT-ONLY, BUNDLE-test-sscp — and all three also carry real positive prices,
// so dropping their zero rows both prevents the crash and returns the price we actually want.
//
// The filter is deliberately scoped to bundle SKUs and must stay that way. 45 non-bundle SKUs are
// legitimately free with no other price row (EDU-EXL-* express courses, NOM-SHIP-FEE-*, INST-RES-*,
// EDU-EXP-*-DIG, NOM-DPS-* deposits); filtering those would leave them looking unpriced, which the
// UI cannot tell apart from "price missing" and which blocks Buy now. Remove this once the gateway
// middleware is fixed (CT-BP-1) — it lives in the commerce-tools repo, not here.
const BUNDLE_SKU_PREFIX = 'BUNDLE-';

const buildWhereClause = ({ skuList, currencyCode, distributionChannelId }: Variables) => {
  const quote = (skus: string[]) => skus.map((sku) => `"${sku}"`).join(', ');
  const bundleSkus = skuList.filter((sku) => sku.startsWith(BUNDLE_SKU_PREFIX));
  const otherSkus = skuList.filter((sku) => !sku.startsWith(BUNDLE_SKU_PREFIX));

  const skuPredicates = [
    otherSkus.length ? `sku in (${quote(otherSkus)})` : '',
    bundleSkus.length ? `(sku in (${quote(bundleSkus)}) and value(centAmount > 0))` : '',
  ].filter(Boolean);

  // No bundles in this wave (the common case) leaves the predicate byte-identical to before.
  const [singlePredicate = `sku in ()`] = skuPredicates;
  const skuPredicate =
    skuPredicates.length > 1 ? `(${skuPredicates.join(' or ')})` : singlePredicate;

  const where = `${skuPredicate} and value(currencyCode = "${currencyCode}") and channel(id = "${distributionChannelId}")`;

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
  // 500 is commercetools' maximum page size. A SKU carries one price per customer group, so a batch
  // of N SKUs returns several times N rows and can still overflow one page.
  const limit = 500;
  const { data, isPending, isFetching, error, refetch } = useQuery<StandalonePrice[]>({
    queryKey: [QUERY_KEYS.STANDALONE_PRICE, distributionChannelId, currencyCode, ...skuList],
    queryFn: async () => {
      if (!skuList?.length || !distributionChannelId) {
        return [];
      }
      const api = await getServiceLayerAPI();
      const where = buildWhereClause({
        skuList,
        currencyCode: customCurrencyCode ?? currencyCode,
        distributionChannelId,
      });

      const fetchPage = async (offset: number) => {
        const response = await api.post('', {
          query: 'GET_STANDALONE_PRICES',
          variables: { limit, offset, ...where },
        });
        return response.data.data.standalonePrices;
      };

      // The first page also reports `total`, which is what tells us how many more there are. Once
      // that is known the rest are independent, so they go out concurrently instead of one-at-a-
      // time: this used to be a serial `do…while`, which meant a large batch (the B2B PLP's price
      // sort queues its whole result set — biggest of all right after Clear) paid one full round
      // trip of latency per page.
      const firstPage = await fetchPage(0);
      const total: number = firstPage.total ?? 0;

      const remainingOffsets: number[] = [];
      for (let offset = limit; offset < total; offset += limit) {
        remainingOffsets.push(offset);
      }

      let allPrices: StandalonePrice[] = transformDiscountedPrice(firstPage.results);

      // Concurrency is capped rather than firing every page at once: these all go through one
      // shared service-layer client, and a wide burst risks tripping over rate limiting. Pages are
      // also settled individually — this query has `retry: false`, so letting one rejected page
      // reject the whole batch would discard the pages that did succeed and leave every SKU in the
      // batch unpriced, which stalls anything waiting on them. Partial results beat none.
      for (let i = 0; i < remainingOffsets.length; i += CONCURRENT_PAGE_REQUESTS) {
        const settled = await Promise.allSettled(
          remainingOffsets.slice(i, i + CONCURRENT_PAGE_REQUESTS).map(fetchPage)
        );

        settled.forEach((outcome) => {
          if (outcome.status === 'fulfilled') {
            allPrices = allPrices.concat(transformDiscountedPrice(outcome.value.results));
          }
        });
      }

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
