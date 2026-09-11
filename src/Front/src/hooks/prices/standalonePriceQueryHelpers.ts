import { getServiceLayerAPI } from 'utils/index';
import { StandalonePrice } from 'types/index';
import { baseProductPrice } from 'providers/index';

/** Max price pages in flight at once — see the comment at the loop that uses it. */
export const CONCURRENT_PAGE_REQUESTS = 4;

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
export const BUNDLE_SKU_PREFIX = 'BUNDLE-';

export type StandalonePriceWhereVariables = {
  skuList: string[];
  currencyCode: string;
  distributionChannelId?: string;
};

export const buildWhereClause = ({
  skuList,
  currencyCode,
  distributionChannelId,
}: StandalonePriceWhereVariables) => {
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

export const transformDiscountedPrice = (standalonePrices: StandalonePrice[]) =>
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

export type FetchAllStandalonePricePagesArgs = StandalonePriceWhereVariables & {
  limit: number;
  // commercetools' standalone price search only supports filtering the customerGroup reference by
  // `id`, not `key` (filtering by key comes back as an InvalidInput error), and we only have the
  // key. So, same as useGetStandalonePrices.tsx's DEFINED_GROUPS matching, this is applied
  // client-side against the customerGroup.key already present on each fetched row instead of as a
  // server-side predicate.
  customerGroupKey?: string;
};

// The first page also reports `total`, which is what tells us how many more there are. Once that
// is known the rest are independent, so they go out concurrently instead of one-at-a-time. Pages
// are also settled individually (not `Promise.all`) so one rejected page cannot discard the pages
// that did succeed, which would otherwise leave every SKU in the batch unpriced.
export async function fetchAllStandalonePricePages({
  limit,
  customerGroupKey,
  ...whereVariables
}: FetchAllStandalonePricePagesArgs): Promise<StandalonePrice[]> {
  const { skuList, distributionChannelId } = whereVariables;
  if (!skuList?.length || !distributionChannelId) {
    return [];
  }

  const api = await getServiceLayerAPI();
  const where = buildWhereClause(whereVariables);

  const fetchPage = async (offset: number) => {
    const response = await api.post('', {
      query: 'GET_STANDALONE_PRICES',
      variables: { limit, offset, ...where },
    });
    return response.data.data.standalonePrices;
  };

  const firstPage = await fetchPage(0);
  const total: number = firstPage.total ?? 0;

  const remainingOffsets: number[] = [];
  for (let offset = limit; offset < total; offset += limit) {
    remainingOffsets.push(offset);
  }

  let allPrices: StandalonePrice[] = transformDiscountedPrice(firstPage.results);

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

  return customerGroupKey
    ? allPrices.filter((price) => price.customerGroup?.key === customerGroupKey)
    : allPrices;
}
